begin;
create table nival_pr.message_templates(business_id uuid not null references nival_pr.businesses(id),segment text not null check(segment in ('new','active','frequent','risk','lost','near_reward')),body text not null check(length(body) between 1 and 1500),primary key(business_id,segment));
alter table nival_pr.message_templates enable row level security;
revoke all on nival_pr.message_templates from public;
grant select,insert,update on nival_pr.message_templates to npr_v2_owner;
create policy message_owner on nival_pr.message_templates to npr_v2_owner using(nival_pr.has_business(business_id)) with check(nival_pr.has_business(business_id));
create trigger entitlement_write before insert or update or delete on nival_pr.message_templates for each row execute function nival_pr_private.guard_tool_write();
alter table nival_pr.rewards add column expires_at timestamptz,add column stock int check(stock>=0);
grant update(expires_at,stock) on nival_pr.rewards to npr_v2_owner;
-- Stock and expiry apply to future redemptions, including direct API attempts.
create function nival_pr_private.reward_availability() returns trigger language plpgsql security definer set search_path='' as $$ declare r nival_pr.rewards;begin
 if new.type<>'redeem' then return new;end if;
 select rw.* into r from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id where rw.id=new.reward_id and p.business_id=new.business_id for update of rw;
 if r.id is null or (r.expires_at is not null and r.expires_at<=now()) then raise exception 'Premio vencido';end if;
 if r.stock=0 then raise exception 'Premio agotado';end if;
 if r.stock is not null then update nival_pr.rewards set stock=stock-1 where id=r.id;end if;
 return new;end $$;
revoke all on function nival_pr_private.reward_availability() from public;
create trigger reward_availability before insert on nival_pr.point_ledger for each row execute function nival_pr_private.reward_availability();
-- Owners can correct a balance only by appending an auditable, reasoned movement.
create function nival_pr_private.manual_adjustment(b uuid,c uuid,delta integer,reason text,operation uuid) returns uuid language plpgsql security definer set search_path='' as $$ declare entry uuid;begin
 perform nival_pr_private.assert_owner(b);
 if not nival_pr_private.tool_enabled(b,'points') then raise exception 'Servicio no activo';end if;
 if delta=0 or abs(delta)>100000 or length(trim(reason)) not between 5 and 500 then raise exception 'Ajuste inválido: indica puntos y motivo';end if;
 if not exists(select 1 from nival_pr.customers where id=c and business_id=b) then raise exception 'Cliente inválido';end if;
 perform set_config('npr.manual_adjustment','allowed',true);
 insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,note,operation_id) values(b,c,'adjust',delta,nival_pr.uid(),trim(reason),operation) returning id into entry;
 perform set_config('npr.manual_adjustment','',true);
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data) values(nival_pr.uid(),'points.adjusted','point_ledger',entry,b,jsonb_build_object('delta',delta,'reason',trim(reason)));
 return entry;end $$;
revoke all on function nival_pr_private.manual_adjustment(uuid,uuid,integer,text,uuid) from public;
grant execute on function nival_pr_private.manual_adjustment(uuid,uuid,integer,text,uuid) to npr_v2_auth;
create or replace function nival_pr_private.guard_movement() returns trigger language plpgsql security definer set search_path='' as $$
declare p nival_pr.programs; balance bigint; cost integer; visits integer; last_visit timestamptz;
begin
 -- Verifica el actor antes de leer o bloquear datos: BEFORE triggers preceden WITH CHECK.
 if current_setting('role') in ('npr_v2_owner','npr_v2_staff') and not exists(
 select 1 from nival_pr.memberships m join nival_pr.profiles pr on pr.id=m.user_id
 where m.user_id=nival_pr.uid() and m.business_id=new.business_id and m.active
 and m.role=case when current_setting('role')='npr_v2_staff' then 'staff' else 'owner' end
 and pr.role=m.role and new.staff_id=m.user_id
 ) then raise exception 'row-level security: actor no autorizado'; end if;
 if new.reversal_of is not null and new.type<>'adjust' then raise exception 'Invalid reversal type'; end if;
 if new.type='adjust' and new.reward_id is not null then raise exception 'Adjust has no reward'; end if;
 -- Serializa todos los movimientos del cliente, incluidas solicitudes concurrentes.
 perform 1 from nival_pr.customers where id=new.customer_id and business_id=new.business_id for update;
 if not found then raise exception 'Cliente invalido'; end if;
 if new.type<>'adjust' and not exists(select 1 from nival_pr.businesses where id=new.business_id and status in ('activo','por_vencer') and (paid_until>now() or trial_ends_at>now())) then raise exception 'Servicio no activo'; end if;
 select * into p from nival_pr.programs where business_id=new.business_id;
 if not found then raise exception 'Programa no configurado'; end if;
 select coalesce(sum(points),0) into balance from nival_pr.point_ledger where customer_id=new.customer_id;
 new.created_at=now();
 if new.type='visit' then
  if new.points<>p.points_per_visit then raise exception 'Cantidad de puntos invalida'; end if;
  select max(created_at),count(*) filter(where (created_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date) into last_visit,visits from nival_pr.point_ledger where customer_id=new.customer_id and type='visit';
  if last_visit is not null and now()-last_visit < make_interval(secs=>((p.rules->>'min_hours_between_visits')::numeric*3600)::double precision) then raise exception 'Visita demasiado reciente'; end if;
  if visits >= (p.rules->>'max_visits_per_day')::integer then raise exception 'Limite diario'; end if;
 elsif new.type='redeem' then
  if new.evidence_path is null or new.evidence_path !~ ('^' || new.business_id::text || '/' || new.customer_id::text || '/[a-f0-9-]+[.](jpg|png|webp)$') then raise exception 'Foto obligatoria'; end if;
  if not exists(select 1 from nival_pr_private.evidence_uploads e where e.path=new.evidence_path and e.business_id=new.business_id and e.customer_id=new.customer_id and e.actor_id=new.staff_id and e.used_at is null and e.expires_at>now()) then raise exception 'Evidencia no verificada'; end if;

  select points_cost into cost from nival_pr.rewards where id=new.reward_id and program_id=p.id and active;
  if cost is null or new.points<>-cost then raise exception 'Premio invalido'; end if;
  if p.mode='single' and new.reward_id<>(select id from nival_pr.rewards where program_id=p.id and active order by position limit 1) then raise exception 'Premio fuera del modo single'; end if;
  if p.mode='choose' and not exists(select 1 from nival_pr.customer_goals where customer_id=new.customer_id and reward_id=new.reward_id and locked) then raise exception 'Selecciona tu meta antes de canjear'; end if;
  if p.mode in ('sequence','surprise') and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de secuencia'; end if;
 elsif new.type='adjust' then
  if new.reversal_of is null then
   if coalesce(current_setting('npr.manual_adjustment',true),'')<>'allowed' or not exists(select 1 from nival_pr.memberships where user_id=nival_pr.uid() and business_id=new.business_id and role='owner' and active) or length(trim(coalesce(new.note,'')))<5 then raise exception 'Ajuste requiere motivo y propietario';end if;
  elsif current_setting('role')='npr_v2_staff' then raise exception 'Reversion invalida';end if;

  if new.reversal_of is not null and not exists(select 1 from nival_pr.point_ledger l where l.id=new.reversal_of and l.customer_id=new.customer_id and l.business_id=new.business_id and l.type='redeem' and new.points=-l.points) then raise exception 'Reversion invalida'; end if;
 end if;
 if balance+new.points<0 then raise exception 'Saldo insuficiente'; end if;
 return new;
end $$;


commit;
