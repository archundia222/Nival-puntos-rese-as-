begin;
-- Keep plan IDs, customers, ledger and reports when changing prices or plans.
create or replace function nival_pr_private.set_initial_plan(b uuid,price integer) returns void language plpgsql security definer set search_path='' as $$ declare p uuid;begin
 if price not in (299,399,499) then raise exception 'Plan inválido';end if;
 if not exists(select 1 from nival_pr.memberships where business_id=b and user_id=nival_pr.uid() and role='owner' and active) then raise exception 'Owner required';end if;
 select id into p from nival_pr.plans where interval='month' and price_mxn=price order by name limit 1;
 if p is null then raise exception 'Plan no disponible';end if;
 update nival_pr.businesses set plan_id=p where id=b and status in ('registrado','cotizando') and paid_until is null;
 if not found then raise exception 'Consulta a Nival para cambiar un servicio contratado';end if;
end $$;
revoke all on function nival_pr_private.set_initial_plan(uuid,integer) from public;
grant execute on function nival_pr_private.set_initial_plan(uuid,integer) to npr_v2_auth;
commit;
