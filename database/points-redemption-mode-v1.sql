-- Points redemption mode, expiration inventory, and redemption history.
-- Additive migration: existing program settings are translated; ledger/redemption rows are preserved.
alter table nival_pr.programs add column if not exists redemption_mode text not null default 'immediate';
alter table nival_pr.programs add column if not exists reward_validity_days integer not null default 7;
update nival_pr.programs set redemption_mode=case when rules#>>'{card_design,rewardExpiryMode}'='duration' then 'validity' else 'immediate' end,
 reward_validity_days=least(365,greatest(1,case coalesce(rules#>>'{card_design,rewardExpiryUnit}','months')
 when 'days' then coalesce(nullif(rules#>>'{card_design,rewardExpiryValue}','')::integer,7)
 when 'weeks' then coalesce(nullif(rules#>>'{card_design,rewardExpiryValue}','')::integer,1)*7
 else coalesce(nullif(rules#>>'{card_design,rewardExpiryValue}','')::integer,1)*30 end));
do $$ begin
 if not exists(select 1 from pg_constraint where conname='programs_redemption_mode_check') then alter table nival_pr.programs add constraint programs_redemption_mode_check check(redemption_mode in ('immediate','validity')); end if;
 if not exists(select 1 from pg_constraint where conname='programs_reward_validity_days_check') then alter table nival_pr.programs add constraint programs_reward_validity_days_check check(reward_validity_days between 1 and 365); end if;
end $$;
create table if not exists nival_pr.customer_available_rewards (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id),
 customer_id uuid not null, reward_id uuid not null references nival_pr.rewards(id),
 earned_ledger_id uuid not null references nival_pr.point_ledger(id), redeemed_ledger_id uuid references nival_pr.point_ledger(id),
 earned_at timestamptz not null default now(), expires_at timestamptz not null,
 status text not null default 'available' check(status in ('available','redeemed','expired')),
 foreign key(customer_id,business_id) references nival_pr.customers(id,business_id)
);
grant update (redemption_mode,reward_validity_days) on nival_pr.programs to npr_v2_owner;
create index if not exists customer_available_rewards_lookup on nival_pr.customer_available_rewards(customer_id,status,expires_at);
alter table nival_pr.redemptions add column if not exists branch_id uuid;
alter table nival_pr.redemptions add column if not exists created_at timestamptz;
update nival_pr.redemptions d set branch_id=l.branch_id,created_at=l.created_at from nival_pr.point_ledger l where l.id=d.ledger_id and (d.branch_id is null or d.created_at is null);
alter table nival_pr.redemptions alter column created_at set default now();
update nival_pr.redemptions set created_at=now() where created_at is null;
alter table nival_pr.redemptions alter column created_at set not null;

create or replace function nival_pr_private.reward_is_redeemable(c uuid,r uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare goal integer; mode text; unlock_at timestamptz; balance bigint;
begin
 select rw.points_cost,p.redemption_mode into goal,mode from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id join nival_pr.customers cu on cu.business_id=p.business_id
 where rw.id=r and cu.id=c and rw.active and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0);
 if goal is null then return false; end if;
 select coalesce(sum(points),0) into balance from nival_pr.point_ledger where customer_id=c;
 if balance<goal then return false; end if;
 if mode='validity' then return exists(select 1 from nival_pr.customer_available_rewards ar where ar.customer_id=c and ar.reward_id=r and ar.status='available' and ar.expires_at>now()); end if;
 unlock_at:=nival_pr_private.reward_unlock_time(c,goal);
 return unlock_at is not null and (unlock_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date
 and exists(select 1 from nival_pr.point_ledger l where l.customer_id=c and l.type='visit' and l.created_at>=unlock_at);
end $$;

create or replace function nival_pr_private.track_available_reward() returns trigger language plpgsql security definer set search_path='' as $$
declare p nival_pr.programs; rw uuid; cost integer; balance bigint;
begin
 if new.type='visit' then
  select * into p from nival_pr.programs where business_id=new.business_id;
  if p.redemption_mode='validity' then
   rw:=nival_pr_private.next_reward(new.customer_id);
   select points_cost into cost from nival_pr.rewards where id=rw and active;
   select coalesce(sum(points),0) into balance from nival_pr.point_ledger where customer_id=new.customer_id;
   if rw is not null and cost is not null and balance>=cost then
    insert into nival_pr.customer_available_rewards(business_id,customer_id,reward_id,earned_ledger_id,earned_at,expires_at)
    values(new.business_id,new.customer_id,rw,new.id,new.created_at,new.created_at+make_interval(days=>p.reward_validity_days));
   end if;
  end if;
 elsif new.type='redeem' then
  update nival_pr.customer_available_rewards set status='redeemed',redeemed_ledger_id=new.id
  where id=(select id from nival_pr.customer_available_rewards where customer_id=new.customer_id and reward_id=new.reward_id and status='available' and expires_at>now() order by earned_at limit 1);
 end if;
 return new;
end $$;
drop trigger if exists track_available_reward on nival_pr.point_ledger;
create trigger track_available_reward after insert on nival_pr.point_ledger for each row execute function nival_pr_private.track_available_reward();

create or replace function nival_pr_private.guard_reward_window() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.type='redeem' and not nival_pr_private.reward_is_redeemable(new.customer_id,new.reward_id) then raise exception 'El premio ya venció o no está disponible para canje'; end if;
 return new;
end $$;
drop trigger if exists guard_reward_window on nival_pr.point_ledger;
create trigger guard_reward_window before insert on nival_pr.point_ledger for each row execute function nival_pr_private.guard_reward_window();

create or replace function nival_pr_private.create_redemption() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.type='redeem' then
  insert into nival_pr.redemptions(ledger_id,reward_id,photo_path,value_mxn,branch_id,created_at) values(new.id,new.reward_id,new.evidence_path,new.redemption_value_mxn,new.branch_id,new.created_at);
  update nival_pr_private.evidence_uploads set used_at=now() where path=new.evidence_path;
  update nival_pr.customer_goals set locked=false where customer_id=new.customer_id and locked;
 end if;
 return new;
end $$;
create or replace function nival_pr_private.expire_customer_rewards(c uuid) returns void language sql security definer set search_path='' as $$
 update nival_pr.customer_available_rewards set status='expired' where customer_id=c and status='available' and expires_at<=now()
$$;
create or replace function nival_pr_private.customer_card(b uuid,h text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; customer uuid;
begin
 select c.id into customer from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now();
 if customer is null then return null; end if;
 perform nival_pr_private.expire_customer_rewards(customer);
 select jsonb_build_object('id',c.id,'manual_code',c.manual_code,'name',c.name,
 'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=c.id),
 'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost,'photo_url',photo_url) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'available_rewards',case when p.redemption_mode='validity' then coalesce((select jsonb_agg(jsonb_build_object('id',ar.id,'reward_id',r.id,'name',r.name,'points_cost',r.points_cost,'photo_url',r.photo_url,'expires_at',ar.expires_at,'status',ar.status) order by ar.expires_at) from nival_pr.customer_available_rewards ar join nival_pr.rewards r on r.id=ar.reward_id where ar.customer_id=c.id and ar.status='available' and ar.expires_at>now()),'[]'::jsonb) else '[]'::jsonb end,
 'redeemed_rewards',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'photo_url',x.photo_url,'created_at',x.created_at,'branch_id',x.branch_id,'status',x.status) order by x.created_at desc) from (select l.id,r.name,r.photo_url,l.created_at,l.branch_id,coalesce(d.status,'aprobado') status from nival_pr.point_ledger l join nival_pr.rewards r on r.id=l.reward_id left join nival_pr.redemptions d on d.ledger_id=l.id where l.customer_id=c.id and l.type='redeem' and (d.status is null or d.status<>'revertido') order by l.created_at desc limit 30)x),'[]'::jsonb),
 'reward_redeemable',coalesce(nival_pr_private.reward_is_redeemable(c.id,nival_pr_private.next_reward(c.id)),false),
 'reward_policy',nival_pr_private.segment_reward_policy(c.id),
 'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 into result from nival_pr.customers c join nival_pr.programs p on p.business_id=c.business_id where c.id=customer;
 return result;
end $$;
revoke all on function nival_pr_private.track_available_reward() from public;
revoke all on function nival_pr_private.guard_reward_window() from public;
revoke all on function nival_pr_private.expire_customer_rewards(uuid) from public;
