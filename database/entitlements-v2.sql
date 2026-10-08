begin;
create or replace function nival_pr_private.tool_enabled(b uuid,tool text) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select bs.status in ('activo','por_vencer') and (bs.paid_until>now() or bs.trial_ends_at>now()) and
 (tool='points' or (tool='reviews' and coalesce((p.features->>'review_limit')::int,0)>0 and coalesce((p.features->>'points_only')::boolean,false)=false))
 from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id where bs.id=b),false)
$$;
revoke all on function nival_pr_private.tool_enabled(uuid,text) from public;
create function nival_pr_private.tool_context(b uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$ begin
 if not exists(select 1 from nival_pr.profiles where id=nival_pr.uid() and role='superadmin') and not exists(select 1 from nival_pr.memberships where business_id=b and user_id=nival_pr.uid() and active) then raise exception 'Negocio no autorizado';end if;
 return (select jsonb_build_object('status',bs.status,'paid_until',bs.paid_until,'trial_ends_at',bs.trial_ends_at,'features',coalesce(p.features,'{}'::jsonb)) from nival_pr.businesses bs left join nival_pr.plans p on p.id=bs.plan_id where bs.id=b);
end $$;
revoke all on function nival_pr_private.tool_context(uuid) from public;
grant execute on function nival_pr_private.tool_context(uuid) to npr_v2_auth;
create or replace function nival_pr_private.guard_tool_write() returns trigger language plpgsql security definer set search_path='' as $$
declare b uuid; tool text:='points'; actor_role text;
begin
 if tg_table_name='rewards' then select business_id into b from nival_pr.programs where id=case when tg_op='DELETE' then old.program_id else new.program_id end;
 else b:=case when tg_op='DELETE' then old.business_id else new.business_id end;end if;
 select role into actor_role from nival_pr.profiles where id=nival_pr.uid();
 -- Infrastructure migrations and administrative corrections do not impersonate owners.
 if actor_role is null then return case when tg_op='DELETE' then old else new end;end if;
 if tg_table_name in ('reviews','generated_reports','review_reports') then tool:='reviews';
 elsif actor_role='superadmin' then return case when tg_op='DELETE' then old else new end;end if;
 if not nival_pr_private.tool_enabled(b,tool) then raise exception 'Servicio no activo o herramienta no incluida en el plan';end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function nival_pr_private.guard_tool_write() from public;
do $$ declare t text;begin
 foreach t in array array['programs','rewards','customers','point_ledger','segment_settings','reviews','generated_reports','review_reports'] loop
 execute format('create trigger entitlement_write before insert or update or delete on nival_pr.%I for each row execute function nival_pr_private.guard_tool_write()',t);
 end loop;
end $$;
-- Plan changes record effective timestamps without moving or deleting any business data.
create table nival_pr.plan_history(id uuid primary key default gen_random_uuid(),business_id uuid not null references nival_pr.businesses(id),old_plan_id uuid references nival_pr.plans(id),plan_id uuid references nival_pr.plans(id),effective_at timestamptz not null default now(),actor_id uuid references nival_pr.profiles(id));
alter table nival_pr.plan_history enable row level security;
revoke all on nival_pr.plan_history from public;
grant select on nival_pr.plan_history to npr_v2_owner,npr_v2_admin;
create policy plan_history_owner on nival_pr.plan_history to npr_v2_owner using(nival_pr.has_business(business_id));
create policy plan_history_admin on nival_pr.plan_history to npr_v2_admin using(true);
create function nival_pr_private.record_plan_change() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if old.plan_id is distinct from new.plan_id then insert into nival_pr.plan_history(business_id,old_plan_id,plan_id,actor_id) values(new.id,old.plan_id,new.plan_id,nival_pr.uid());end if;
 return new;end $$;
revoke all on function nival_pr_private.record_plan_change() from public;
create trigger record_plan_change after update of plan_id on nival_pr.businesses for each row execute function nival_pr_private.record_plan_change();
-- Approved analyses are permanent snapshots. Sending metadata can still be recorded.
create function nival_pr_private.protect_report_snapshot() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if old.status='approved' and (new.business_id,new.kind,new.period_start,new.period_end,new.rating,new.total_reviews,new.analysis,new.status,new.approved_at) is distinct from (old.business_id,old.kind,old.period_start,old.period_end,old.rating,old.total_reviews,old.analysis,old.status,old.approved_at) then raise exception 'El reporte aprobado es un snapshot histórico. Genera otro reporte.';end if;
 return new;end $$;
revoke all on function nival_pr_private.protect_report_snapshot() from public;
create trigger protect_report_snapshot before update on nival_pr.generated_reports for each row execute function nival_pr_private.protect_report_snapshot();
commit;
