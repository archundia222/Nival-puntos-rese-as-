-- Incremental, additive migration for promotion details and redemption value.
-- Apply only to the isolated Nival Puntos y Reseñas Neon database.
begin;

alter table nival_pr.rewards
 add column if not exists reward_type text not null default 'product'
  check(reward_type in ('discount','product')),
 add column if not exists value_mxn numeric(12,2)
  check(value_mxn is null or value_mxn between 0 and 1000000);

alter table nival_pr.point_ledger
 add column if not exists redemption_value_mxn numeric(12,2)
  check(redemption_value_mxn is null or redemption_value_mxn between 0 and 1000000);

alter table nival_pr.redemptions
 add column if not exists value_mxn numeric(12,2)
  check(value_mxn is null or value_mxn between 0 and 1000000);

create or replace function nival_pr_private.limit_active_rewards() returns trigger
language plpgsql security definer set search_path='' as $$
declare active_count integer;
begin
 if new.active then
  perform 1 from nival_pr.programs where id=new.program_id for update;
  select count(*) into active_count from nival_pr.rewards
   where program_id=new.program_id and active and id is distinct from new.id;
  if active_count>=10 then raise exception 'Limite de diez promociones activas'; end if;
 end if;
 return new;
end $$;
revoke all on function nival_pr_private.limit_active_rewards() from public;
drop trigger if exists rewards_active_limit on nival_pr.rewards;
create trigger rewards_active_limit before insert or update of active,program_id on nival_pr.rewards
 for each row execute function nival_pr_private.limit_active_rewards();

create or replace function nival_pr_private.create_redemption() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.type='redeem' then
  insert into nival_pr.redemptions(ledger_id,reward_id,photo_path,value_mxn)
   values(new.id,new.reward_id,new.evidence_path,new.redemption_value_mxn);
  update nival_pr_private.evidence_uploads set used_at=now() where path=new.evidence_path;
  update nival_pr.customer_goals set locked=false where customer_id=new.customer_id and locked;
 end if;
 return new;
end $$;
revoke all on function nival_pr_private.create_redemption() from public;

commit;
