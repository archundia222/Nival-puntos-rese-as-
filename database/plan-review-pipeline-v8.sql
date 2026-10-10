-- Additive review pipeline and correct per-plan reply entitlements.
-- Preserve all existing prices, plan rows, payments, reviews and reports.
begin;

create or replace function nival_pr_private.plan_review_limit(plan_id uuid)
returns integer
language sql stable security definer set search_path=''
as $$
  select case
    when p.price_mxn=399 then 30
    when p.price_mxn=499 then 100
    else coalesce((p.features->>'review_limit')::integer,0)
  end
  from nival_pr.plans p
  where p.id=plan_id
$$;
revoke all on function nival_pr_private.plan_review_limit(uuid) from public;
grant execute on function nival_pr_private.plan_review_limit(uuid) to npr_v2_admin,npr_v2_owner,npr_v2_auth;

create or replace function nival_pr_private.tool_enabled(b uuid,tool text)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((
   select bs.status in ('activo','por_vencer')
     and (bs.paid_until>now() or bs.trial_ends_at>now())
     and (tool='points' or (tool='reviews'
       and nival_pr_private.plan_review_limit(p.id)>0
       and coalesce((p.features->>'points_only')::boolean,false)=false))
   from nival_pr.businesses bs
   left join nival_pr.plans p on p.id=bs.plan_id
   where bs.id=b
 ),false)
$$;
revoke all on function nival_pr_private.tool_enabled(uuid,text) from public;

create or replace function nival_pr_private.tool_context(b uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from nival_pr.profiles where id=nival_pr.uid() and role='superadmin')
   and not exists(select 1 from nival_pr.memberships where business_id=b and user_id=nival_pr.uid() and active)
 then raise exception 'Negocio no autorizado'; end if;
 select jsonb_build_object(
   'status',bs.status,
   'paid_until',bs.paid_until,
   'trial_ends_at',bs.trial_ends_at,
   'features',coalesce(p.features,'{}'::jsonb)||jsonb_build_object('review_limit',nival_pr_private.plan_review_limit(p.id))
 ) into result
 from nival_pr.businesses bs
 left join nival_pr.plans p on p.id=bs.plan_id
 where bs.id=b;
 return result;
end $$;
revoke all on function nival_pr_private.tool_context(uuid) from public;
grant execute on function nival_pr_private.tool_context(uuid) to npr_v2_auth;

alter table nival_pr.reviews
  add column if not exists source text not null default 'manual'
    check(source in ('manual','google_api','other_api')),
  add column if not exists review_status text not null default 'pending'
    check(review_status in ('pending','drafted','approved','published')),
  add column if not exists response_status text not null default 'pending'
    check(response_status in ('pending','drafted','approved','published'));
alter table nival_pr.generated_reports
  add column if not exists source text not null default 'manual'
    check(source in ('manual','google_api','other_api')),
  add column if not exists ingestion_status text not null default 'manual'
    check(ingestion_status in ('manual','assisted','automatic'));
alter table nival_pr.tasks
  add column if not exists execution_mode text not null default 'manual'
    check(execution_mode in ('manual','assisted','automatic'));

update nival_pr.reviews set review_status='published' where review_status='pending';
update nival_pr.reviews
set response_status=case when published_at is not null then 'published'
                         when nullif(trim(response_draft),'') is not null then 'drafted'
                         else 'pending' end
where response_status='pending';

create or replace function nival_pr.publish_review(r uuid,reply text)
returns void language plpgsql security invoker set search_path='' as $$
declare b nival_pr.businesses; limit_n int; used int; start_at timestamptz;
begin
 if length(trim(reply)) not between 1 and 10000 then raise exception 'Respuesta inválida'; end if;
 select bs.* into b from nival_pr.businesses bs
 join nival_pr.reviews rv on rv.business_id=bs.id where rv.id=r for update of bs;
 if b.id is null then raise exception 'Reseña no encontrada'; end if;
 if b.status not in ('activo','por_vencer') or b.paid_until<=now() or b.paid_until is null then raise exception 'Servicio no activo'; end if;
 if exists(select 1 from nival_pr.reviews where id=r and published_at is not null) then raise exception 'Reseña ya respondida'; end if;
 select case when p.price_mxn=399 then 30 when p.price_mxn=499 then 100 else coalesce((p.features->>'review_limit')::integer,0) end into limit_n from nival_pr.businesses bs join nival_pr.plans p on p.id=bs.plan_id where bs.id=b.id;
 if limit_n is null then raise exception 'Plan sin cupo configurado'; end if;
 start_at=coalesce(b.service_started_at,b.paid_until-interval '30 days');
 start_at=start_at+floor(extract(epoch from now()-start_at)/2592000)::int*interval '30 days';
 select count(*) into used from nival_pr.reviews where business_id=b.id and published_at>=start_at and published_at<start_at+interval '30 days';
 if used>=limit_n then raise exception 'Cupo agotado. Las respuestas adicionales quedan pendientes.'; end if;
 update nival_pr.reviews
 set published_at=now(),published_response=trim(reply),response_draft=trim(reply),response_status='published'
 where id=r;
 insert into nival_pr.audit_log(actor_id,action,entity,business_id,entity_id)
 values(nival_pr.uid(),'review.published','reviews',b.id,r);
end $$;
revoke all on function nival_pr.publish_review(uuid,text) from public;
grant execute on function nival_pr.publish_review(uuid,text) to npr_v2_admin;
commit;
