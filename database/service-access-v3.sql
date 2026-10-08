begin;
update nival_pr.plans set features=features||jsonb_build_object('points_only',price_mxn=299,'reviews_enabled',price_mxn<>299,'review_limit',case when price_mxn=499 then 100 else 0 end) where interval='month' and price_mxn in (299,399,499);
create or replace function nival_pr_private.tool_enabled(b uuid,tool text) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select bs.status in ('activo','por_vencer') and greatest(coalesce(bs.paid_until,'-infinity'),coalesce(bs.trial_ends_at,'-infinity'))>now() and
 case when tool='points' then true when tool='reviews' then coalesce((p.features->>'reviews_enabled')::boolean,false) and not coalesce((p.features->>'points_only')::boolean,false) when tool='replies' then coalesce((p.features->>'review_limit')::int,0)>0 and not coalesce((p.features->>'points_only')::boolean,false) else false end
 from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id where bs.id=b),false)
$$;
-- Existing public and movement functions must regard a paid, expiring account as active.
-- Reuse their full audited bodies without replacing unrelated validation logic.
do $$ declare r record; body text; begin
 for r in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='nival_pr_private' and p.proname in ('public_business','enroll_customer','staff_credentials','staff_login_record','choose_reward','set_customer_reward','guard_movement')) or (n.nspname='nival_pr' and p.proname in ('guard_movement','publish_review')) loop
 body:=pg_get_functiondef(r.oid);
 body:=replace(body,'b.status=''activo''','b.status in (''activo'',''por_vencer'')');
 body:=replace(body,'bs.status=''activo''','bs.status in (''activo'',''por_vencer'')');
 body:=replace(body,'status=''activo''','status in (''activo'',''por_vencer'')');
 body:=replace(body,'b.status<>''activo''','b.status not in (''activo'',''por_vencer'')');
 execute body;
 end loop;
end $$;
-- Preserve duplicate historical rows; only one outstanding task per business and title.
with ranked as (select id,row_number() over(partition by business_id,title order by created_at,id) position from nival_pr.tasks where status in ('pendiente','en_progreso')) update nival_pr.tasks set status='cancelada' where id in (select id from ranked where position>1);
create unique index tasks_one_outstanding on nival_pr.tasks(business_id,title) where status in ('pendiente','en_progreso');
-- Queued reputation work is hidden rather than deleted on downgrade or expiration.
create or replace function nival_pr_private.task_service_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.business_id is not null and new.status in ('pendiente','en_progreso') and (tg_op='INSERT' or old.status is distinct from new.status) and new.title<>'Cobrar mensualidad' and not nival_pr_private.tool_enabled(new.business_id,case when new.title like 'Puntos ·%' then 'points' else 'reviews' end) then raise exception 'Servicio de reseñas no activo';end if;
 return new;
end $$;
revoke all on function nival_pr_private.task_service_guard() from public;
create trigger task_service_guard before insert or update of status on nival_pr.tasks for each row execute function nival_pr_private.task_service_guard();
commit;
