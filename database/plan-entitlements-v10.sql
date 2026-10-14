-- Plan entitlements requested for the public launch. Keep prices, plan IDs and payment history.
begin;
alter table nival_pr.businesses add column if not exists pay_business_ref text check(pay_business_ref is null or length(pay_business_ref)<=160);
alter table nival_pr.businesses add column if not exists pay_card_url text check(pay_card_url is null or (length(pay_card_url)<=2000 and pay_card_url like 'https://%'));
alter table nival_pr.businesses add column if not exists pay_card_label text check(pay_card_label is null or length(pay_card_label)<=100);
update nival_pr.plans
 set name='Nival Básico',
     features=coalesce(features,'{}'::jsonb)||'{"points_only":false,"reviews_enabled":true,"review_limit":10,"branch_limit":1,"nfc_card_limit":3}'::jsonb
 where interval='month' and price_mxn=299;
update nival_pr.plans
 set name='Nival Esencial',
     features=coalesce(features,'{}'::jsonb)||'{"points_only":false,"reviews_enabled":true,"review_limit":30,"branch_limit":5,"nfc_card_limit":6}'::jsonb
 where interval='month' and price_mxn=399;
update nival_pr.plans
 set name='Nival Plus',
     features=coalesce(features,'{}'::jsonb)||'{"points_only":false,"reviews_enabled":true,"review_limit":100,"branch_limit":10,"nfc_card_limit":12}'::jsonb
 where interval='month' and price_mxn=549;

create or replace function nival_pr_private.plan_review_limit(plan_id uuid)
returns integer language sql stable security definer set search_path='' as $$
 select coalesce((p.features->>'review_limit')::integer,case p.price_mxn when 299 then 10 when 399 then 30 when 549 then 100 else 0 end)
 from nival_pr.plans p where p.id=plan_id
$$;
revoke all on function nival_pr_private.plan_review_limit(uuid) from public;
grant execute on function nival_pr_private.plan_review_limit(uuid) to npr_v2_admin,npr_v2_owner,npr_v2_auth;

create or replace function nival_pr_private.manage_branch(b uuid,br uuid,n text,a boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare found_id uuid; active_n integer; branch_limit integer;
begin
 perform nival_pr_private.assert_owner(b);
 perform 1 from nival_pr.businesses where id=b for update;
 select coalesce((p.features->>'branch_limit')::integer,case p.price_mxn when 299 then 1 when 399 then 5 when 549 then 10 else 1 end)
  into branch_limit from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id where bs.id=b;
 if br is null then
  if length(trim(n)) not between 1 and 120 then raise exception 'Nombre de sucursal inválido'; end if;
  select count(*) into active_n from nival_pr.branches where business_id=b and active;
  if active_n>=branch_limit then raise exception 'Tu plan permite hasta % sucursal(es) activa(s)',branch_limit; end if;
  insert into nival_pr.branches(business_id,name,code) values(b,trim(n),substr(replace(gen_random_uuid()::text,'-',''),1,8)) returning id into found_id;
 else
  select id into found_id from nival_pr.branches where id=br and business_id=b for update;
  if found_id is null then raise exception 'Sucursal no encontrada'; end if;
  if not a and exists(select 1 from nival_pr.branches where id=br and is_primary) then raise exception 'La sucursal principal no se puede desactivar'; end if;
  if a then
   select count(*) into active_n from nival_pr.branches where business_id=b and active and id<>br;
   if active_n>=branch_limit then raise exception 'Tu plan permite hasta % sucursal(es) activa(s)',branch_limit; end if;
  end if;
  if n is not null and length(trim(n)) not between 1 and 120 then raise exception 'Nombre de sucursal inválido'; end if;
  update nival_pr.branches set name=coalesce(nullif(trim(n),''),name),active=a where id=br;
  if not a then update nival_pr.memberships set active=false where branch_id=br and role='staff';
   delete from nival_pr_private.staff_sessions where business_id=b and user_id in(select user_id from nival_pr.memberships where branch_id=br); end if;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
  values(nival_pr.uid(),'branch.changed','branches',found_id,b,jsonb_build_object('name',n,'active',a));
 return found_id;
end $$;
revoke all on function nival_pr_private.manage_branch(uuid,uuid,text,boolean) from public;
grant execute on function nival_pr_private.manage_branch(uuid,uuid,text,boolean) to npr_v2_auth;

create or replace function nival_pr_private.manage_review_card(b uuid,c text,l text,a boolean)
returns text language plpgsql security definer set search_path='' as $$
declare chosen text; target text; active_count integer; card_limit integer;
begin
 perform nival_pr_private.assert_owner(b);
 perform 1 from nival_pr.businesses where id=b for update;
 select coalesce((p.features->>'nfc_card_limit')::integer,case p.price_mxn when 299 then 3 when 399 then 6 when 549 then 12 else 3 end)
  into card_limit from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id where bs.id=b;
 if c is null then
  if length(trim(l)) not between 1 and 80 then raise exception 'Nombre de tarjeta inválido'; end if;
  select google_maps_url into target from nival_pr.businesses where id=b;
  if target is null or target !~ '^https://' then raise exception 'Configura primero el enlace de Google'; end if;
  select count(*) into active_count from nival_pr.review_cards where business_id=b and active;
  if active_count>=card_limit then raise exception 'Tu plan incluye hasta % tarjetas NFC activas',card_limit; end if;
  chosen=substr(replace(gen_random_uuid()::text,'-',''),1,18);
  insert into nival_pr.short_links(code,target_url,business_id) values(chosen,target,b);
  insert into nival_pr.review_cards(code,business_id,label,active) values(chosen,b,trim(l),true);
 else
  if not exists(select 1 from nival_pr.review_cards where code=c and business_id=b) then raise exception 'Tarjeta no encontrada'; end if;
  if a then
   select count(*) into active_count from nival_pr.review_cards where business_id=b and active and code<>c;
   if active_count>=card_limit then raise exception 'Tu plan incluye hasta % tarjetas NFC activas',card_limit; end if;
  end if;
  update nival_pr.review_cards set active=a,label=case when nullif(trim(l),'') is null then label else trim(l) end where code=c and business_id=b;
  chosen=c;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
  values(nival_pr.uid(),'review_card.changed','review_cards',null,b,jsonb_build_object('code',chosen,'active',a,'label',l));
 return chosen;
end $$;
revoke all on function nival_pr_private.manage_review_card(uuid,text,text,boolean) from public;
grant execute on function nival_pr_private.manage_review_card(uuid,text,text,boolean) to npr_v2_auth;

create or replace function nival_pr.owner_branch_is_active(b uuid,br uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(nival_pr.has_business(b) and exists(select 1 from nival_pr.branches x where x.id=br and x.business_id=b and x.active),false)
$$;
create or replace function nival_pr.owner_branch_is_primary(b uuid,br uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(nival_pr.has_business(b) and exists(select 1 from nival_pr.branches x where x.id=br and x.business_id=b and x.active and x.is_primary),false)
$$;
revoke all on function nival_pr.owner_branch_is_active(uuid,uuid) from public;
revoke all on function nival_pr.owner_branch_is_primary(uuid,uuid) from public;
grant execute on function nival_pr.owner_branch_is_active(uuid,uuid),nival_pr.owner_branch_is_primary(uuid,uuid) to npr_v2_owner,npr_v2_admin;

create or replace function nival_pr.customer_segments_for_branch(b uuid,as_of date,br uuid)
returns table(id uuid,name text,phone text,visits bigint,recent_visits bigint,first_visit date,last_visit date,is_new boolean,is_frequent boolean,is_risk boolean,is_lost boolean,absent_month boolean)
language sql stable security invoker set search_path='' as $$
 with cfg as (select coalesce(s.new_days,14) nd,coalesce(s.frequent_days,30) fd,coalesce(s.frequent_visits,3) fv,coalesce(s.risk_from,31) rf,coalesce(s.lost_after,60) la,coalesce(s.risk_visits,2) rv from (values(1)) t(x) left join nival_pr.segment_settings s on s.business_id=b),
 stats as (select c.id,c.name,c.phone,count(l.id) visits,count(l.id) filter(where (l.created_at at time zone 'America/Mexico_City')::date>as_of-cfg.fd) recent_visits,
 min((l.created_at at time zone 'America/Mexico_City')::date) first_visit,max((l.created_at at time zone 'America/Mexico_City')::date) last_visit
 from nival_pr.customers c cross join cfg left join nival_pr.point_ledger l on l.customer_id=c.id and l.business_id=b and (l.branch_id=br or (l.branch_id is null and nival_pr.owner_branch_is_primary(b,br))) and l.type='visit' and (l.created_at at time zone 'America/Mexico_City')::date<=as_of
 where c.business_id=b and nival_pr.owner_branch_is_active(b,br) group by c.id,c.name,c.phone,cfg.fd)
 select s.*,coalesce(s.first_visit>as_of-cfg.nd,false),s.recent_visits>=cfg.fv,
 coalesce(as_of-s.last_visit between cfg.rf and cfg.la and s.visits>=cfg.rv,false),coalesce(as_of-s.last_visit>cfg.la,false),
 coalesce(s.last_visit<date_trunc('month',as_of)::date,true) from stats s cross join cfg
$$;
revoke all on function nival_pr.customer_segments_for_branch(uuid,date,uuid) from public;
grant execute on function nival_pr.customer_segments_for_branch(uuid,date,uuid) to npr_v2_owner,npr_v2_admin;
commit;
