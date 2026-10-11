begin;
-- Keep business plan references valid while moving the existing Plus tier to its new price.
do $$
declare old_id uuid; new_id uuid;
begin
 select id into old_id from nival_pr.plans where interval='month' and price_mxn=499 order by id limit 1;
 select id into new_id from nival_pr.plans where interval='month' and price_mxn=549 order by id limit 1;
 if old_id is not null and new_id is null then
  update nival_pr.plans set name='Nival Plus',price_mxn=549,features=coalesce(features,'{}'::jsonb)||'{"points_only":false,"reviews_enabled":true,"review_limit":100}'::jsonb where id=old_id;
 elsif old_id is not null and new_id is not null and old_id<>new_id then
  update nival_pr.businesses set plan_id=new_id where plan_id=old_id;
  delete from nival_pr.plans where id=old_id;
 end if;
 update nival_pr.plans set name='Nival Plus',features=coalesce(features,'{}'::jsonb)||'{"points_only":false,"reviews_enabled":true,"review_limit":100}'::jsonb where interval='month' and price_mxn=549;
 update nival_pr.plans set name='Nival Esencial',features=coalesce(features,'{}'::jsonb)||'{"points_only":false,"reviews_enabled":true,"review_limit":30}'::jsonb where interval='month' and price_mxn=399;
end $$;

-- Update only stored plan selectors; preserve the function's existing authorization logic.
do $$
declare r record; body text;
begin
 for r in
  select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='nival_pr_private' and p.proname in ('set_initial_plan','plan_review_limit'))
     or (n.nspname='nival_pr' and p.proname='publish_review')
 loop
  body:=pg_get_functiondef(r.oid);
  body:=replace(body,'499','549');
  execute body;
 end loop;
end $$;

-- Keep the independent reply capability aligned with each plan's 30 day limit.
create or replace function nival_pr_private.tool_enabled(b uuid,tool text)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((
   select bs.status in ('activo','por_vencer')
     and (bs.paid_until>now() or bs.trial_ends_at>now())
     and case
       when tool='points' then true
       when tool='reviews' then nival_pr_private.plan_review_limit(p.id)>0
         and coalesce((p.features->>'points_only')::boolean,false)=false
       when tool='replies' then nival_pr_private.plan_review_limit(p.id)>0
         and coalesce((p.features->>'points_only')::boolean,false)=false
       else false
     end
   from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id
   where bs.id=b
 ),false)
$$;
revoke all on function nival_pr_private.tool_enabled(uuid,text) from public;
grant execute on function nival_pr_private.tool_enabled(uuid,text) to npr_v2_admin,npr_v2_owner,npr_v2_auth;

create table if not exists nival_pr.business_comparisons(
 business_id uuid primary key references nival_pr.businesses(id) on delete cascade,
 business_rating numeric(2,1) not null check(business_rating between 1 and 5),
 business_reviews integer not null check(business_reviews>=0),
 zone_average_rating numeric(2,1) not null check(zone_average_rating between 1 and 5),
 zone_average_reviews integer not null check(zone_average_reviews>=0),
 updated_by uuid not null references nival_pr.profiles(id),
 updated_at timestamptz not null default now()
);
alter table nival_pr.point_ledger add column if not exists ticket_value_mxn numeric(12,2) check(ticket_value_mxn is null or ticket_value_mxn between 0 and 1000000);
alter table nival_pr.rewards add column if not exists photo_url text check(photo_url is null or (length(photo_url)<=2000 and photo_url like 'https://%'));
alter table nival_pr.review_reports add column if not exists manual_summary text check(manual_summary is null or length(manual_summary)<=10000);
alter table nival_pr.business_comparisons enable row level security;
revoke all on nival_pr.business_comparisons from public;
grant select,insert,update on nival_pr.business_comparisons to npr_v2_admin;
grant select on nival_pr.business_comparisons to npr_v2_owner;
drop policy if exists business_comparison_admin on nival_pr.business_comparisons;
create policy business_comparison_admin on nival_pr.business_comparisons to npr_v2_admin using(true) with check(true);
drop policy if exists business_comparison_owner on nival_pr.business_comparisons;
create policy business_comparison_owner on nival_pr.business_comparisons to npr_v2_owner using(nival_pr.has_business(business_id));
commit;
