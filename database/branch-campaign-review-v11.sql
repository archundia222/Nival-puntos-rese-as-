-- Nival Puntos + Reseñas: branch-scoped campaign selection, Google profiles and review reports.
-- Additive migration. Existing rewards, cards, customer balances and reports are preserved.
begin;

alter table nival_pr.branches add column if not exists campaign_rules jsonb;
alter table nival_pr.branches add column if not exists google_maps_url text;
update nival_pr.branches br set google_maps_url=b.google_maps_url
from nival_pr.businesses b where br.business_id=b.id and br.is_primary and br.google_maps_url is null and b.google_maps_url is not null;

alter table nival_pr.review_cards add column if not exists branch_id uuid;
update nival_pr.review_cards c set branch_id=br.id from nival_pr.branches br
where c.business_id=br.business_id and br.is_primary and c.branch_id is null;
do $$ begin
 alter table nival_pr.review_cards add constraint review_cards_branch_business_fk
 foreign key(branch_id,business_id) references nival_pr.branches(id,business_id);
exception when duplicate_object then null; end $$;
create index if not exists review_cards_branch_idx on nival_pr.review_cards(branch_id) where active;

create table if not exists nival_pr.branch_review_reports(
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references nival_pr.businesses(id) on delete cascade,
 branch_id uuid not null,
 period date not null,
 period_kind text not null check(period_kind in ('day','month','year')),
 rating numeric not null check(rating between 1 and 5),
 total_reviews integer not null check(total_reviews>=0),
 new_reviews integer not null check(new_reviews>=0),
 answered integer not null check(answered>=0),
 distribution jsonb not null default '{}'::jsonb,
 profile_checklist jsonb not null default '{}'::jsonb,
 notes text,
 created_by uuid,
 answered_scope text not null default 'period',
 manual_summary text,
 created_at timestamptz not null default now(),
 constraint branch_review_reports_branch_fk foreign key(branch_id,business_id) references nival_pr.branches(id,business_id),
 constraint branch_review_reports_unique unique(branch_id,period,period_kind)
);
alter table nival_pr.branch_review_reports enable row level security;
revoke all on nival_pr.branch_review_reports from public;
grant select,insert,update,delete on nival_pr.branch_review_reports to npr_v2_admin;
drop policy if exists branch_review_reports_admin on nival_pr.branch_review_reports;
create policy branch_review_reports_admin on nival_pr.branch_review_reports for all to npr_v2_admin using(true) with check(true);

create or replace function nival_pr_private.list_branch_settings(b uuid)
returns table(branch_id uuid,campaign_rules jsonb,google_maps_url text)
language plpgsql stable security definer set search_path='' as $$
begin
 perform nival_pr_private.assert_owner(b);
 return query select br.id,br.campaign_rules,br.google_maps_url from nival_pr.branches br where br.business_id=b;
end $$;
revoke all on function nival_pr_private.list_branch_settings(uuid) from public;
grant execute on function nival_pr_private.list_branch_settings(uuid) to npr_v2_auth;

create or replace function nival_pr_private.save_branch_campaigns(b uuid,br uuid,rules jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare k text; ids jsonb; total_ids integer;
begin
 perform nival_pr_private.assert_owner(b);
 if not exists(select 1 from nival_pr.branches x where x.id=br and x.business_id=b and x.active)
 then raise exception 'Sucursal no disponible'; end if;
 if jsonb_typeof(rules)<>'object' or rules->>'strategy' not in ('manual','random')
    or jsonb_typeof(rules->'targets')<>'object'
    or exists(select 1 from jsonb_object_keys(rules->'targets') as t(key) where t.key not in ('all','frequent','at_risk'))
 then raise exception 'Reglas de campaña inválidas'; end if;
 foreach k in array array['all','frequent','at_risk'] loop
   ids=rules#>array['targets',k];
   if jsonb_typeof(ids)<>'array' or jsonb_array_length(ids)<1 or jsonb_array_length(ids)>10 then
    raise exception 'Asigna promociones a los tres segmentos'; end if;
   select count(*) into total_ids from jsonb_array_elements_text(ids) as t(id)
   where not exists(
    select 1 from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id
    where rw.id::text=t.id and p.business_id=b and rw.active
      and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0));
   if total_ids>0 then raise exception 'Una promoción no está activa o no pertenece al negocio'; end if;
 end loop;
 update nival_pr.branches set campaign_rules=rules where id=br and business_id=b;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
 values(nival_pr.uid(),'branch.campaigns.changed','branches',br,b,jsonb_build_object('strategy',rules->>'strategy'));
end $$;
revoke all on function nival_pr_private.save_branch_campaigns(uuid,uuid,jsonb) from public;
grant execute on function nival_pr_private.save_branch_campaigns(uuid,uuid,jsonb) to npr_v2_auth;

create or replace function nival_pr_private.save_branch_google_url(b uuid,br uuid,url text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform nival_pr_private.assert_owner(b);
 if not exists(select 1 from nival_pr.branches x where x.id=br and x.business_id=b and x.active)
 then raise exception 'Sucursal no disponible'; end if;
 if url is not null and (length(url)>2000 or url !~ '^https://')
 then raise exception 'Enlace HTTPS inválido'; end if;
 update nival_pr.branches set google_maps_url=nullif(trim(url),'') where id=br and business_id=b;
 update nival_pr.short_links l set target_url=url
 from nival_pr.review_cards c where c.code=l.code and c.business_id=b and c.branch_id=br and url is not null;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
 values(nival_pr.uid(),'branch.google.changed','branches',br,b,jsonb_build_object('configured',url is not null));
end $$;
revoke all on function nival_pr_private.save_branch_google_url(uuid,uuid,text) from public;
grant execute on function nival_pr_private.save_branch_google_url(uuid,uuid,text) to npr_v2_auth;

create or replace function nival_pr_private.list_branch_review_cards(b uuid)
returns table(code text,label text,active boolean,created_at timestamptz,branch_id uuid)
language plpgsql stable security definer set search_path='' as $$
begin
 perform nival_pr_private.assert_owner(b);
 return query select c.code,c.label,c.active,c.created_at,
 coalesce(c.branch_id,(select id from nival_pr.branches where business_id=b and is_primary limit 1))
 from nival_pr.review_cards c where c.business_id=b order by c.created_at,c.code;
end $$;
revoke all on function nival_pr_private.list_branch_review_cards(uuid) from public;
grant execute on function nival_pr_private.list_branch_review_cards(uuid) to npr_v2_auth;

create or replace function nival_pr_private.manage_review_card_branch(b uuid,br uuid,c text,l text,a boolean)
returns text language plpgsql security definer set search_path='' as $$
declare chosen text; target text; active_count integer; card_limit integer;
begin
 perform nival_pr_private.assert_owner(b);
 perform 1 from nival_pr.businesses where id=b for update;
 if not exists(select 1 from nival_pr.branches where id=br and business_id=b and active)
 then raise exception 'Sucursal no disponible'; end if;
 select coalesce(nullif(x.google_maps_url,''),case when x.is_primary then bs.google_maps_url else null end)
 into target from nival_pr.branches x join nival_pr.businesses bs on bs.id=x.business_id where x.id=br and x.business_id=b;
 select coalesce((p.features->>'nfc_card_limit')::integer,3) into card_limit
 from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id where bs.id=b;
 card_limit=coalesce(card_limit,3);
 if c is null then
   if length(trim(l)) not between 1 and 80 then raise exception 'Nombre de tarjeta inválido'; end if;
   if target is null or target !~ '^https://' then raise exception 'Configura primero el enlace de Google de la sucursal'; end if;
   select count(*) into active_count from nival_pr.review_cards where business_id=b and active;
   if active_count>=card_limit then raise exception 'Límite de tarjetas NFC alcanzado'; end if;
   chosen=substr(replace(gen_random_uuid()::text,'-',''),1,18);
   insert into nival_pr.short_links(code,target_url,business_id) values(chosen,target,b);
   insert into nival_pr.review_cards(code,business_id,branch_id,label,active) values(chosen,b,br,trim(l),true);
 else
   if not exists(select 1 from nival_pr.review_cards where code=c and business_id=b
    and coalesce(branch_id,(select id from nival_pr.branches where business_id=b and is_primary limit 1))=br)
   then raise exception 'Tarjeta de otra sucursal'; end if;
   if a then
     if target is null or target !~ '^https://' then raise exception 'Configura primero el enlace de Google de la sucursal'; end if;
     select count(*) into active_count from nival_pr.review_cards where business_id=b and active and code<>c;
     if active_count>=card_limit then raise exception 'Límite de tarjetas NFC alcanzado'; end if;
   end if;
   update nival_pr.review_cards set active=a,label=coalesce(nullif(trim(l),''),label),branch_id=br where code=c and business_id=b;
   if a then update nival_pr.short_links set target_url=target where code=c and business_id=b; end if;
   chosen=c;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
 values(nival_pr.uid(),'review_card.branch.changed','review_cards',null,b,jsonb_build_object('code',chosen,'branch_id',br,'active',a));
 return chosen;
end $$;
revoke all on function nival_pr_private.manage_review_card_branch(uuid,uuid,text,text,boolean) from public;
grant execute on function nival_pr_private.manage_review_card_branch(uuid,uuid,text,text,boolean) to npr_v2_auth;

create or replace function nival_pr_private.list_branch_review_reports(b uuid,br uuid,cutoff date)
returns setof nival_pr.branch_review_reports language plpgsql stable security definer set search_path='' as $$
begin
 perform nival_pr_private.assert_owner(b);
 if not exists(select 1 from nival_pr.branches where id=br and business_id=b) then raise exception 'Sucursal no disponible'; end if;
 return query select * from nival_pr.branch_review_reports r
 where r.business_id=b and r.branch_id=br and r.period<cutoff order by r.period,r.period_kind;
end $$;
revoke all on function nival_pr_private.list_branch_review_reports(uuid,uuid,date) from public;
grant execute on function nival_pr_private.list_branch_review_reports(uuid,uuid,date) to npr_v2_auth;

-- The card shows the reward locked for the customer. New assignments use the
-- last visit's branch, or the primary branch until the first visit.
create or replace function nival_pr_private.next_reward(c uuid)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare
 p nival_pr.programs; r uuid; br uuid; rules jsonb; audience text:='all'; candidates jsonb;
 recent_visits integer:=0; lifetime_visits integer:=0; last_visit timestamptz;
 frequent_days integer:=30; frequent_visits integer:=3; risk_from integer:=31; lost_after integer:=60; risk_visits integer:=2;
begin
 perform 1 from nival_pr.customers where id=c for update;
 select pr.* into p from nival_pr.programs pr join nival_pr.customers cu on cu.business_id=pr.business_id where cu.id=c;
 if p.id is null then return null; end if;
 select coalesce(l.branch_id,pr.id) into br from nival_pr.point_ledger l
 cross join lateral (select id from nival_pr.branches where business_id=p.business_id and is_primary limit 1) pr
 where l.customer_id=c and l.type='visit' order by l.created_at desc,l.id desc limit 1;
 if br is null then select id into br from nival_pr.branches where business_id=p.business_id and is_primary limit 1; end if;
 select x.campaign_rules into rules from nival_pr.branches x where x.id=br and x.business_id=p.business_id;
 rules=coalesce(rules,p.rules->'campaign_rules');
 if p.mode='surprise' then
   select g.reward_id into r from nival_pr.customer_goals g where g.customer_id=c and g.locked limit 1;
   if r is not null then return r; end if;
   select rw.id into r from nival_pr.rewards rw where rw.program_id=p.id and rw.active
   and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0)
   order by -ln(greatest(random(),0.00000001))/greatest(rw.weight,1) limit 1;
   if r is not null then insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true)
     on conflict(customer_id,reward_id) do update set locked=true; end if;
   return r;
 end if;
 if p.mode='single' and rules is not null and jsonb_typeof(rules->'targets')='object' then
   select g.reward_id into r from nival_pr.customer_goals g join nival_pr.rewards rw on rw.id=g.reward_id
   where g.customer_id=c and g.locked and rw.program_id=p.id limit 1;
   if r is not null then return r; end if;
   select coalesce(s.frequent_days,30),coalesce(s.frequent_visits,3),
    coalesce(s.risk_from,31),coalesce(s.lost_after,60),coalesce(s.risk_visits,2)
   into frequent_days,frequent_visits,risk_from,lost_after,risk_visits
   from nival_pr.segment_settings s where s.business_id=p.business_id;
   frequent_days=coalesce(frequent_days,30);frequent_visits=coalesce(frequent_visits,3);
   risk_from=coalesce(risk_from,31);lost_after=coalesce(lost_after,60);risk_visits=coalesce(risk_visits,2);
   select count(*) filter(where l.created_at>=now()-make_interval(days=>frequent_days))::int,
    count(*)::int,max(l.created_at) into recent_visits,lifetime_visits,last_visit
   from nival_pr.point_ledger l where l.customer_id=c and l.type='visit'
   and (l.branch_id=br or (l.branch_id is null and exists(select 1 from nival_pr.branches x where x.id=br and x.is_primary)));
   if recent_visits>=frequent_visits then audience:='frequent';
   elsif lifetime_visits>=risk_visits and last_visit<=now()-make_interval(days=>risk_from)
      and last_visit>now()-make_interval(days=>lost_after) then audience:='at_risk'; end if;
   candidates=rules#>array['targets',audience];
   if jsonb_typeof(candidates)<>'array' or jsonb_array_length(candidates)=0 then candidates=rules#>'{targets,all}'; end if;
   select rw.id into r from nival_pr.rewards rw where rw.program_id=p.id and rw.active
     and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0)
     and exists(select 1 from jsonb_array_elements_text(coalesce(candidates,'[]'::jsonb)) as selected(id) where selected.id=rw.id::text)
   order by case when rules->>'strategy'='random' then random() else 0 end,rw.position,rw.id limit 1;
   if r is not null then
     insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true)
     on conflict(customer_id,reward_id) do update set locked=true;
     return r;
   end if;
 end if;
 with ordered as(
  select rw.id,row_number() over(order by rw.position,rw.id)-1 idx,count(*) over() total
  from nival_pr.rewards rw where rw.program_id=p.id and rw.active
  and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0)
 ),completed as(
  select count(*) n from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id
  where l.customer_id=c and d.status<>'revertido'
 )
 select o.id into r from ordered o cross join completed x where
 (p.mode='single' and o.idx=0) or
 (p.mode='sequence' and o.idx=x.n%o.total) or
 (p.mode='choose' and exists(select 1 from nival_pr.customer_goals g where g.customer_id=c and g.reward_id=o.id and g.locked))
 limit 1;
 return r;
end $$;

commit;
