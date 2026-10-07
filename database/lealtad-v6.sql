begin;
alter table nival_pr.programs drop constraint programs_mode_check;
alter table nival_pr.programs add check(mode in ('single','choose','sequence','surprise'));
alter table nival_pr.rewards add column weight integer not null default 1 check(weight between 1 and 100);
alter table nival_pr.point_ledger add column operation_id uuid;
alter table nival_pr.customers add column manual_code text not null default lpad(floor(random()*100000000)::bigint::text,8,'0');
create unique index customer_manual_code on nival_pr.customers(business_id,manual_code);
create unique index ledger_operation_once on nival_pr.point_ledger(business_id,operation_id) where operation_id is not null;
grant insert(operation_id) on nival_pr.point_ledger to npr_v2_owner,npr_v2_staff;
-- Same-day real visits are allowed. A one-minute guard plus request IDs avoids accidental duplicate points.
alter table nival_pr.programs alter column rules set default '{"min_hours_between_visits":0.0166666667,"max_visits_per_day":100}';
update nival_pr.programs set rules='{"min_hours_between_visits":0.0166666667,"max_visits_per_day":100}' where rules='{"min_hours_between_visits":6,"max_visits_per_day":1}'::jsonb;
create or replace function nival_pr_private.next_reward(c uuid) returns uuid language plpgsql volatile security definer set search_path='' as $$
declare p nival_pr.programs;r uuid;begin
 perform 1 from nival_pr.customers where id=c for update;
 select pr.* into p from nival_pr.programs pr join nival_pr.customers cu on cu.business_id=pr.business_id where cu.id=c;
 if p.mode='surprise' then
  select g.reward_id into r from nival_pr.customer_goals g where g.customer_id=c and g.locked limit 1;
  if r is not null then return r;end if;
  select rw.id into r from nival_pr.rewards rw where rw.program_id=p.id and rw.active order by -ln(greatest(random(),0.00000001))/rw.weight limit 1;
  if r is not null then insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true) on conflict(customer_id,reward_id) do update set locked=true;end if;
  return r;
 end if;
 with ordered as (select rw.id,row_number() over(order by rw.position,rw.id)-1 idx,count(*) over() total from nival_pr.rewards rw where rw.program_id=p.id and rw.active),completed as (select count(*) n from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id where l.customer_id=c and d.status<>'revertido')
 select o.id into r from ordered o cross join completed x where (p.mode='single' and o.idx=0) or (p.mode='sequence' and o.idx=x.n%o.total) or (p.mode='choose' and exists(select 1 from nival_pr.customer_goals g where g.customer_id=c and g.reward_id=o.id and g.locked)) limit 1;
 return r;
end $$;
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
 if new.type<>'adjust' and not exists(select 1 from nival_pr.businesses where id=new.business_id and status='activo' and (paid_until>now() or trial_ends_at>now())) then raise exception 'Servicio no activo'; end if;
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
  if current_setting('role')='npr_v2_staff' or new.reversal_of is null then raise exception 'Reversion invalida'; end if;

  if new.reversal_of is not null and not exists(select 1 from nival_pr.point_ledger l where l.id=new.reversal_of and l.customer_id=new.customer_id and l.business_id=new.business_id and l.type='redeem' and new.points=-l.points) then raise exception 'Reversion invalida'; end if;
 end if;
 if balance+new.points<0 then raise exception 'Saldo insuficiente'; end if;
 return new;
end $$;

create or replace function nival_pr_private.customer_card(b uuid,h text) returns jsonb language sql volatile security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'manual_code',c.manual_code,'name',c.name,'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=c.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now()
$$;

create or replace function nival_pr_private.protect_assigned_rewards() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if (new.name,new.points_cost,new.active) is distinct from (old.name,old.points_cost,old.active) and exists(select 1 from nival_pr.customer_goals g where g.reward_id=old.id and g.locked) then raise exception 'Respeta los premios ya asignados: edita otro premio o espera al canje';end if;
 return new;end $$;
revoke all on function nival_pr_private.protect_assigned_rewards() from public;
create trigger protect_assigned_rewards before update on nival_pr.rewards for each row execute function nival_pr_private.protect_assigned_rewards();
create or replace function nival_pr_private.protect_mode_transition() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.mode<>old.mode and exists(select 1 from nival_pr.customer_goals g join nival_pr.customers c on c.id=g.customer_id where c.business_id=old.business_id and g.locked) then raise exception 'Hay premios asignados pendientes. Cambia de modalidad después de entregarlos';end if;
 return new;end $$;
revoke all on function nival_pr_private.protect_mode_transition() from public;
create trigger protect_mode_transition before update on nival_pr.programs for each row execute function nival_pr_private.protect_mode_transition();
create function nival_pr_private.staff_customer_code(b uuid,code text) returns jsonb language plpgsql security definer set search_path='' as $$ declare c uuid;begin
 perform nival_pr_private.assert_staff_or_owner(b);
 select id into c from nival_pr.customers where business_id=b and manual_code=code;
 if c is null then return null;end if;
 return nival_pr_private.staff_customer(b,null,c);
end $$;
revoke all on function nival_pr_private.staff_customer_code(uuid,text) from public;
grant execute on function nival_pr_private.staff_customer_code(uuid,text) to npr_v2_auth;
-- Private database storage keeps redemptions available until object storage is configured.
grant execute on function nival_pr_private.store_photo(uuid,uuid,text,text,text) to npr_v2_auth;
create or replace function nival_pr_private.read_photo(d uuid) returns table(photo text,mime text) language plpgsql security definer set search_path='' as $$ declare b uuid;begin
 select l.business_id into b from nival_pr.redemptions rd join nival_pr.point_ledger l on l.id=rd.ledger_id where rd.id=d;
 if not exists(select 1 from nival_pr.profiles where id=nival_pr.uid() and role='superadmin') then perform nival_pr_private.assert_owner(b);end if;
 return query select encode(e.data,'base64'),e.mime from nival_pr_private.evidence_photos e join nival_pr.redemptions rd on rd.photo_path=e.path where rd.id=d;
end $$;
grant execute on function nival_pr_private.read_photo(uuid) to npr_v2_auth;
commit;
