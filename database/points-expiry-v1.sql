-- Point expiry is enforced consistently for customer display, staff view, rewards and ledger debits.
begin;
create table if not exists nival_pr.point_lots(
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references nival_pr.businesses(id),
 customer_id uuid not null,
 source_ledger_id uuid not null unique references nival_pr.point_ledger(id),
 earned_at timestamptz not null,
 points_granted integer not null check(points_granted>0),
 points_remaining integer not null check(points_remaining>=0 and points_remaining<=points_granted),\n expires_at timestamptz,
 foreign key(customer_id,business_id) references nival_pr.customers(id,business_id)
);
alter table nival_pr.point_lots enable row level security;
revoke all on nival_pr.point_lots from public;
grant select on nival_pr.point_lots to npr_v2_admin,npr_v2_owner,npr_v2_staff,npr_v2_customer;
create policy point_lots_admin_all on nival_pr.point_lots to npr_v2_admin using(true) with check(true);
create policy point_lots_owner_read on nival_pr.point_lots for select to npr_v2_owner using(nival_pr.has_business(business_id));
create policy point_lots_staff_read on nival_pr.point_lots for select to npr_v2_staff using(nival_pr.has_business(business_id));
create policy point_lots_customer_read on nival_pr.point_lots for select to npr_v2_customer using(exists(select 1 from nival_pr.customers c where c.id=point_lots.customer_id and c.business_id=point_lots.business_id));
create index if not exists point_lots_customer_earned on nival_pr.point_lots(customer_id,earned_at,id);

create or replace function nival_pr.point_balance(c uuid) returns bigint language sql stable security invoker set search_path='' as $$
 select coalesce(sum(l.points_remaining),0)::bigint
 from nival_pr.point_lots l
 where l.customer_id=c and (l.expires_at is null or l.expires_at>now())
$$;
revoke all on function nival_pr.point_balance(uuid) from public;
grant execute on function nival_pr.point_balance(uuid) to npr_v2_admin,npr_v2_owner,npr_v2_staff,npr_v2_customer;

create or replace function nival_pr_private.apply_point_lot_movement() returns trigger language plpgsql security definer set search_path='' as $$
declare remaining integer; lot record; expiry_months integer;
begin
 if new.points>0 then
  select case when (rules#>>'{card_design,expiryMonths}') ~ '^[0-9]{1,2}$'
   then least(60,greatest(1,(rules#>>'{card_design,expiryMonths}')::integer)) else null end
   into expiry_months from nival_pr.programs where business_id=new.business_id;
  insert into nival_pr.point_lots(business_id,customer_id,source_ledger_id,earned_at,points_granted,points_remaining,expires_at)
select l.business_id,l.customer_id,l.id,l.created_at,l.points,l.points,
 case when (p.rules#>>'{card_design,expiryMonths}') ~ '^[0-9]{1,2}$'
  then l.created_at+make_interval(months=>least(60,greatest(1,(p.rules#>>'{card_design,expiryMonths}')::integer)))
  else null end
from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id
join nival_pr.programs p on p.business_id=c.business_id
where l.points>0 on conflict(source_ledger_id) do nothing;
do $backfill$
declare debit record; lot record; remaining integer;
begin
 for debit in select id,business_id,customer_id,created_at,-points amount from nival_pr.point_ledger where points<0 order by created_at,id loop
  remaining:=debit.amount;
  for lot in select id,points_remaining from nival_pr.point_lots where customer_id=debit.customer_id and business_id=debit.business_id and earned_at<=debit.created_at and points_remaining>0 order by earned_at,id for update loop
   exit when remaining<=0;
   update nival_pr.point_lots set points_remaining=points_remaining-least(remaining,lot.points_remaining) where id=lot.id;
   remaining:=remaining-least(remaining,lot.points_remaining);
  end loop;
 end loop;
end $backfill$;

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
 select nival_pr.point_balance(new.customer_id) into balance;
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
  if p.rules#>>'{campaign_rules,scope}' in ('all','segments') then
    if new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de la meta de este cliente'; end if;
  else
  if p.mode='single' and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera del modo single'; end if;
  if p.mode='choose' and not exists(select 1 from nival_pr.customer_goals where customer_id=new.customer_id and reward_id=new.reward_id and locked) then raise exception 'Selecciona tu meta antes de canjear'; end if;
  if p.mode in ('sequence','surprise') and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de secuencia'; end if;
  end if;
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
CREATE OR REPLACE FUNCTION nival_pr_private.reward_is_redeemable(c uuid, r uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare goal integer; mode text; unlock_at timestamptz; balance bigint;
begin
 select rw.points_cost,p.redemption_mode into goal,mode from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id join nival_pr.customers cu on cu.business_id=p.business_id where rw.id=r and cu.id=c and rw.active and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0);
 if goal is null then return false; end if;
 select nival_pr.point_balance(c) into balance;
 if balance<goal then return false; end if;
 if mode='validity' then return exists(select 1 from nival_pr.customer_available_rewards ar where ar.customer_id=c and ar.reward_id=r and ar.status='available' and ar.expires_at>now()); end if;
 unlock_at:=nival_pr_private.reward_unlock_time(c,goal);
 return unlock_at is not null and (unlock_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date and exists(select 1 from nival_pr.point_ledger l where l.customer_id=c and l.type='visit' and l.created_at>=unlock_at);
end $function$
;
CREATE OR REPLACE FUNCTION nival_pr_private.staff_customer(b uuid, ph text, c uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare target nival_pr.customers; r uuid; begin
 perform nival_pr_private.assert_staff_or_owner(b);
 if c is null and (select count(*) from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph)))>1 then raise exception 'Telefono ambiguo usa QR';end if;
 select * into target from nival_pr.customers where business_id=b and ((c is not null and id=c) or (c is null and (phone=ph or (length(phone)=10 and '52'||phone=ph))));
 if not found then return null;end if;
 r=nival_pr_private.next_reward(target.id);
 return jsonb_build_object('id',target.id,'name',target.name,'phone',case when length(target.phone)=10 then '52'||target.phone else target.phone end,'balance',nival_pr.point_balance(target.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=r));end $function$
;
CREATE OR REPLACE FUNCTION nival_pr_private.customer_card(b uuid, h text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb; customer uuid;
begin
 select c.id into customer from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now();
 if customer is null then return null; end if;
 perform nival_pr_private.expire_customer_rewards(customer);
 select jsonb_build_object('id',c.id,'manual_code',c.manual_code,'name',c.name,'balance',nival_pr.point_balance(c.id),
 'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost,'photo_url',photo_url) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'available_rewards',case when p.redemption_mode='validity' then coalesce((select jsonb_agg(jsonb_build_object('id',ar.id,'reward_id',r.id,'name',r.name,'points_cost',r.points_cost,'photo_url',r.photo_url,'expires_at',ar.expires_at,'status',ar.status) order by ar.expires_at) from nival_pr.customer_available_rewards ar join nival_pr.rewards r on r.id=ar.reward_id where ar.customer_id=c.id and ar.status='available' and ar.expires_at>now()),'[]'::jsonb) else '[]'::jsonb end,
 'redeemed_rewards',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'photo_url',x.photo_url,'created_at',x.created_at,'branch_id',x.branch_id,'status',x.status) order by x.created_at desc) from (select l.id,r.name,r.photo_url,l.created_at,l.branch_id,coalesce(d.status,'aprobado') status from nival_pr.point_ledger l join nival_pr.rewards r on r.id=l.reward_id left join nival_pr.redemptions d on d.ledger_id=l.id where l.customer_id=c.id and l.type='redeem' and (d.status is null or d.status<>'revertido') order by l.created_at desc limit 30)x),'[]'::jsonb),
 'reward_redeemable',coalesce(nival_pr_private.reward_is_redeemable(c.id,nival_pr_private.next_reward(c.id)),false),'reward_policy',nival_pr_private.segment_reward_policy(c.id),
 'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 into result from nival_pr.customers c join nival_pr.programs p on p.business_id=c.business_id where c.id=customer;
 return result;
end $function$
;
CREATE OR REPLACE FUNCTION nival_pr_private.track_available_reward()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p nival_pr.programs; rw uuid; cost integer; balance bigint;
begin
 if new.type='visit' then
  select * into p from nival_pr.programs where business_id=new.business_id;
  if p.redemption_mode='validity' then
   rw:=nival_pr_private.next_reward(new.customer_id);
   select points_cost into cost from nival_pr.rewards where id=rw and active;
   select nival_pr.point_balance(new.customer_id) into balance;
   if rw is not null and cost is not null and balance>=cost then
    insert into nival_pr.customer_available_rewards(business_id,customer_id,reward_id,earned_ledger_id,earned_at,expires_at) values(new.business_id,new.customer_id,rw,new.id,new.created_at,new.created_at+make_interval(days=>p.reward_validity_days));
   end if;
  end if;
 elsif new.type='redeem' then
  update nival_pr.customer_available_rewards set status='redeemed',redeemed_ledger_id=new.id where id=(select id from nival_pr.customer_available_rewards where customer_id=new.customer_id and reward_id=new.reward_id and status='available' and expires_at>now() order by earned_at limit 1);
 end if;
 return new;
end $function$
;
commit;

  then l.created_at+make_interval(months=>least(60,greatest(1,(p.rules#>>'{card_design,expiryMonths}')::integer)))
  else null end
from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id
join nival_pr.programs p on p.business_id=c.business_id
where l.points>0 on conflict(source_ledger_id) do nothing;
do $backfill$
declare debit record; lot record; remaining integer;
begin
 for debit in select id,business_id,customer_id,created_at,-points amount from nival_pr.point_ledger where points<0 order by created_at,id loop
  remaining:=debit.amount;
  for lot in select id,points_remaining from nival_pr.point_lots where customer_id=debit.customer_id and business_id=debit.business_id and earned_at<=debit.created_at and points_remaining>0 order by earned_at,id for update loop
   exit when remaining<=0;
   update nival_pr.point_lots set points_remaining=points_remaining-least(remaining,lot.points_remaining) where id=lot.id;
   remaining:=remaining-least(remaining,lot.points_remaining);
  end loop;
 end loop;
end $backfill$;

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
 select nival_pr.point_balance(new.customer_id) into balance;
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
  if p.rules#>>'{campaign_rules,scope}' in ('all','segments') then
    if new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de la meta de este cliente'; end if;
  else
  if p.mode='single' and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera del modo single'; end if;
  if p.mode='choose' and not exists(select 1 from nival_pr.customer_goals where customer_id=new.customer_id and reward_id=new.reward_id and locked) then raise exception 'Selecciona tu meta antes de canjear'; end if;
  if p.mode in ('sequence','surprise') and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de secuencia'; end if;
  end if;
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
CREATE OR REPLACE FUNCTION nival_pr_private.reward_is_redeemable(c uuid, r uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare goal integer; mode text; unlock_at timestamptz; balance bigint;
begin
 select rw.points_cost,p.redemption_mode into goal,mode from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id join nival_pr.customers cu on cu.business_id=p.business_id where rw.id=r and cu.id=c and rw.active and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0);
 if goal is null then return false; end if;
 select nival_pr.point_balance(c) into balance;
 if balance<goal then return false; end if;
 if mode='validity' then return exists(select 1 from nival_pr.customer_available_rewards ar where ar.customer_id=c and ar.reward_id=r and ar.status='available' and ar.expires_at>now()); end if;
 unlock_at:=nival_pr_private.reward_unlock_time(c,goal);
 return unlock_at is not null and (unlock_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date and exists(select 1 from nival_pr.point_ledger l where l.customer_id=c and l.type='visit' and l.created_at>=unlock_at);
end $function$
;
CREATE OR REPLACE FUNCTION nival_pr_private.staff_customer(b uuid, ph text, c uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare target nival_pr.customers; r uuid; begin
 perform nival_pr_private.assert_staff_or_owner(b);
 if c is null and (select count(*) from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph)))>1 then raise exception 'Telefono ambiguo usa QR';end if;
 select * into target from nival_pr.customers where business_id=b and ((c is not null and id=c) or (c is null and (phone=ph or (length(phone)=10 and '52'||phone=ph))));
 if not found then return null;end if;
 r=nival_pr_private.next_reward(target.id);
 return jsonb_build_object('id',target.id,'name',target.name,'phone',case when length(target.phone)=10 then '52'||target.phone else target.phone end,'balance',nival_pr.point_balance(target.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=r));end $function$
;
CREATE OR REPLACE FUNCTION nival_pr_private.customer_card(b uuid, h text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb; customer uuid;
begin
 select c.id into customer from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now();
 if customer is null then return null; end if;
 perform nival_pr_private.expire_customer_rewards(customer);
 select jsonb_build_object('id',c.id,'manual_code',c.manual_code,'name',c.name,'balance',nival_pr.point_balance(c.id),
 'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost,'photo_url',photo_url) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'available_rewards',case when p.redemption_mode='validity' then coalesce((select jsonb_agg(jsonb_build_object('id',ar.id,'reward_id',r.id,'name',r.name,'points_cost',r.points_cost,'photo_url',r.photo_url,'expires_at',ar.expires_at,'status',ar.status) order by ar.expires_at) from nival_pr.customer_available_rewards ar join nival_pr.rewards r on r.id=ar.reward_id where ar.customer_id=c.id and ar.status='available' and ar.expires_at>now()),'[]'::jsonb) else '[]'::jsonb end,
 'redeemed_rewards',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'photo_url',x.photo_url,'created_at',x.created_at,'branch_id',x.branch_id,'status',x.status) order by x.created_at desc) from (select l.id,r.name,r.photo_url,l.created_at,l.branch_id,coalesce(d.status,'aprobado') status from nival_pr.point_ledger l join nival_pr.rewards r on r.id=l.reward_id left join nival_pr.redemptions d on d.ledger_id=l.id where l.customer_id=c.id and l.type='redeem' and (d.status is null or d.status<>'revertido') order by l.created_at desc limit 30)x),'[]'::jsonb),
 'reward_redeemable',coalesce(nival_pr_private.reward_is_redeemable(c.id,nival_pr_private.next_reward(c.id)),false),'reward_policy',nival_pr_private.segment_reward_policy(c.id),
 'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 into result from nival_pr.customers c join nival_pr.programs p on p.business_id=c.business_id where c.id=customer;
 return result;
end $function$
;
CREATE OR REPLACE FUNCTION nival_pr_private.track_available_reward()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p nival_pr.programs; rw uuid; cost integer; balance bigint;
begin
 if new.type='visit' then
  select * into p from nival_pr.programs where business_id=new.business_id;
  if p.redemption_mode='validity' then
   rw:=nival_pr_private.next_reward(new.customer_id);
   select points_cost into cost from nival_pr.rewards where id=rw and active;
   select nival_pr.point_balance(new.customer_id) into balance;
   if rw is not null and cost is not null and balance>=cost then
    insert into nival_pr.customer_available_rewards(business_id,customer_id,reward_id,earned_ledger_id,earned_at,expires_at) values(new.business_id,new.customer_id,rw,new.id,new.created_at,new.created_at+make_interval(days=>p.reward_validity_days));
   end if;
  end if;
 elsif new.type='redeem' then
  update nival_pr.customer_available_rewards set status='redeemed',redeemed_ledger_id=new.id where id=(select id from nival_pr.customer_available_rewards where customer_id=new.customer_id and reward_id=new.reward_id and status='available' and expires_at>now() order by earned_at limit 1);
 end if;
 return new;
end $function$
;
commit;
