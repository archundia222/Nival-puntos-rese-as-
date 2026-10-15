-- Align reward redemption authorization with the branch campaign's locked customer goal.
-- This is the existing guard function with only the single-mode validation updated.
CREATE OR REPLACE FUNCTION nival_pr_private.guard_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if new.points<>p.points_per_visit and not (new.points=p.points_per_visit*2 and (p.rules->>'double_points_weekday') ~ '^[0-6]$' and (p.rules->>'double_points_weekday')::integer=extract(dow from (now() at time zone 'America/Mexico_City'))::integer) then raise exception 'Cantidad de puntos invalida'; end if;
  select max(created_at),count(*) filter(where (created_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date) into last_visit,visits from nival_pr.point_ledger where customer_id=new.customer_id and type='visit';
  if last_visit is not null and now()-last_visit < make_interval(secs=>((p.rules->>'min_hours_between_visits')::numeric*3600)::double precision) then raise exception 'Visita demasiado reciente'; end if;
  if visits >= (p.rules->>'max_visits_per_day')::integer then raise exception 'Limite diario'; end if;
 elsif new.type='redeem' then
  if new.evidence_path is null or new.evidence_path !~ ('^' || new.business_id::text || '/' || new.customer_id::text || '/[a-f0-9-]+[.](jpg|png|webp)$') then raise exception 'Foto obligatoria'; end if;
  if not exists(select 1 from nival_pr_private.evidence_uploads e where e.path=new.evidence_path and e.business_id=new.business_id and e.customer_id=new.customer_id and e.actor_id=new.staff_id and e.used_at is null and e.expires_at>now()) then raise exception 'Evidencia no verificada'; end if;

  select points_cost into cost from nival_pr.rewards where id=new.reward_id and program_id=p.id and active;
  if cost is null or new.points<>-cost then raise exception 'Premio invalido'; end if;
  if p.mode='single' and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera del modo single'; end if;
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
end $function$
;
