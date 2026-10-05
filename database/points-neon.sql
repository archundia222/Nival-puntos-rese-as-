-- Incremental phase 3. Only nival_puntos_resenas, after foundation-v1.
begin;
alter table nival_pr.programs alter column rules set default '{"min_hours_between_visits":6,"max_visits_per_day":1}';
alter table nival_pr.customers add column token_expires_at timestamptz default now()+interval '1 year', add column consent_version text;
alter table nival_pr.point_ledger add column evidence_path text;
create table nival_pr_private.evidence_uploads(path text primary key,business_id uuid not null references nival_pr.businesses(id),customer_id uuid not null references nival_pr.customers(id),actor_id uuid not null references nival_pr.profiles(id),expires_at timestamptz not null default now()+interval '30 minutes',used_at timestamptz);
alter table nival_pr_private.evidence_uploads enable row level security;
revoke all on nival_pr_private.evidence_uploads from public;
create table nival_pr_private.recovery_links(token_hash text primary key,business_id uuid not null references nival_pr.businesses(id),customer_id uuid not null references nival_pr.customers(id),issued_by uuid not null references nival_pr.profiles(id),expires_at timestamptz not null default now()+interval '15 minutes',used_at timestamptz);
alter table nival_pr_private.recovery_links enable row level security;
revoke all on nival_pr_private.recovery_links from public;
-- Staff identities have no email password account. Keep FK enforcement for email roles in trigger.
alter table nival_pr.profiles drop constraint profiles_id_fkey;
create function nival_pr_private.profile_identity_guard() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.role<>'staff' and not exists(select 1 from neon_auth."user" where id=new.id) then raise exception 'Email identity required'; end if;
 return new;end $$;
revoke all on function nival_pr_private.profile_identity_guard() from public;
create trigger profile_identity_guard before insert or update on nival_pr.profiles for each row execute function nival_pr_private.profile_identity_guard();
-- Sensitive new tables are internal. Their functions are callable only by trusted server roles.
create function nival_pr_private.assert_owner(b uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from nival_pr.memberships m join nival_pr.profiles p on p.id=m.user_id where m.user_id=nival_pr.uid() and m.business_id=b and m.active and m.role='owner' and p.role='owner') then raise exception 'Owner required'; end if;end $$;
revoke all on function nival_pr_private.assert_owner(uuid) from public;
create function nival_pr_private.assert_staff_or_owner(b uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from nival_pr.memberships m join nival_pr.profiles p on p.id=m.user_id where m.user_id=nival_pr.uid() and m.business_id=b and m.active and m.role=p.role and p.role in ('staff','owner')) then raise exception 'Active membership required'; end if;end $$;
revoke all on function nival_pr_private.assert_staff_or_owner(uuid) from public;
create function nival_pr_private.next_reward(c uuid) returns uuid language sql stable security definer set search_path='' as $$
 with program as (select p.* from nival_pr.programs p join nival_pr.customers c1 on c1.business_id=p.business_id where c1.id=c),
 ordered as (select r.id,row_number() over(order by r.position,r.id)-1 idx,count(*) over() total from nival_pr.rewards r join program p on p.id=r.program_id where r.active),
 completed as (select count(*) n from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id where l.customer_id=c and d.status<>'revertido')
 select o.id from ordered o cross join program p cross join completed x where
 (p.mode='single' and o.idx=0) or (p.mode='sequence' and o.idx=x.n%o.total) or
 (p.mode='choose' and exists(select 1 from nival_pr.customer_goals g where g.customer_id=c and g.reward_id=o.id and g.locked)) limit 1
$$;
revoke all on function nival_pr_private.next_reward(uuid) from public;
-- Guard is SECURITY DEFINER and first validates role/membership from transaction context.
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
  if p.mode='sequence' and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de secuencia'; end if;
 elsif new.type='adjust' then
  if current_setting('role')='npr_v2_staff' or new.reversal_of is null then raise exception 'Reversion invalida'; end if;

  if new.reversal_of is not null and not exists(select 1 from nival_pr.point_ledger l where l.id=new.reversal_of and l.customer_id=new.customer_id and l.business_id=new.business_id and l.type='redeem' and new.points=-l.points) then raise exception 'Reversion invalida'; end if;
 end if;
 if balance+new.points<0 then raise exception 'Saldo insuficiente'; end if;
 return new;
end $$;

create or replace function nival_pr_private.create_redemption() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.type='redeem' then
 insert into nival_pr.redemptions(ledger_id,reward_id,photo_path) values(new.id,new.reward_id,new.evidence_path);
 update nival_pr_private.evidence_uploads set used_at=now() where path=new.evidence_path;
 update nival_pr.customer_goals set locked=false where customer_id=new.customer_id and locked;
 end if;return new;end $$;
-- owner cannot bypass locked choose goal with direct writes.
revoke insert,update,delete on nival_pr.customer_goals from npr_v2_owner;
create or replace function nival_pr_private.choose_goal(b uuid,h text,r uuid) returns void language plpgsql security definer set search_path='' as $$ declare c uuid; begin
 select id into c from nival_pr.customers where business_id=b and device_token_hash=h and consent_at is not null and token_expires_at>now() for update;
 if c is null then raise exception 'Invalid token'; end if;
 if not exists(select 1 from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id join nival_pr.businesses bs on bs.id=p.business_id where rw.id=r and rw.active and p.business_id=b and p.mode='choose' and bs.status='activo' and (bs.paid_until>now() or bs.trial_ends_at>now())) then raise exception 'Invalid reward'; end if;
 if exists(select 1 from nival_pr.customer_goals where customer_id=c and locked and reward_id<>r) then raise exception 'Goal locked'; end if;
 insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true) on conflict(customer_id,reward_id) do update set locked=true;
 end $$;
create function nival_pr_private.manage_staff(b uuid,u uuid,n text,pin text,a boolean) returns uuid language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_owner(b);
 if u is null then
  if length(trim(n)) not between 1 and 100 or pin !~ '^scrypt[$][a-f0-9]{32}[$][a-f0-9]{128}$' then raise exception 'Invalid staff'; end if;
  u=gen_random_uuid(); insert into nival_pr.profiles(id,role,full_name) values(u,'staff',trim(n));
  insert into nival_pr.memberships(user_id,business_id,role,pin_hash,active) values(u,b,'staff',pin,true);
 else
  update nival_pr.memberships set active=a where business_id=b and user_id=u and role='staff';
  if not found then raise exception 'Staff not found'; end if;
  if not a then delete from nival_pr_private.staff_sessions where user_id=u and business_id=b;end if;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id) values(nival_pr.uid(),'staff.changed','profiles',u,b);
 return u;end $$;
revoke all on function nival_pr_private.manage_staff(uuid,uuid,text,text,boolean) from public;
grant execute on function nival_pr_private.manage_staff(uuid,uuid,text,text,boolean) to npr_v2_auth;
create function nival_pr_private.list_staff(b uuid) returns table(id uuid,name text,active boolean) language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_owner(b);
 return query select p.id,p.full_name,m.active from nival_pr.memberships m join nival_pr.profiles p on p.id=m.user_id where m.business_id=b and m.role='staff' order by p.full_name;end $$;
revoke all on function nival_pr_private.list_staff(uuid) from public;
grant execute on function nival_pr_private.list_staff(uuid) to npr_v2_auth;
create function nival_pr_private.staff_customer(b uuid,ph text,c uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare target nival_pr.customers; r uuid; begin
 perform nival_pr_private.assert_staff_or_owner(b);
 select * into target from nival_pr.customers where business_id=b and ((c is not null and id=c) or (c is null and phone=ph));
 if not found then return null;end if;
 r=nival_pr_private.next_reward(target.id);
 return jsonb_build_object('id',target.id,'name',target.name,'phone',target.phone,'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=target.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=r));end $$;
revoke all on function nival_pr_private.staff_customer(uuid,text,uuid) from public;
grant execute on function nival_pr_private.staff_customer(uuid,text,uuid) to npr_v2_auth;
create function nival_pr_private.verify_evidence(b uuid,c uuid,path text) returns void language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_staff_or_owner(b);
 if not exists(select 1 from nival_pr.customers where id=c and business_id=b) or path !~ ('^'||b::text||'/'||c::text||'/[a-f0-9-]+[.](jpg|png|webp)$') then raise exception 'Invalid evidence';end if;
 insert into nival_pr_private.evidence_uploads(path,business_id,customer_id,actor_id) values(path,b,c,nival_pr.uid());end $$;
revoke all on function nival_pr_private.verify_evidence(uuid,uuid,text) from public;
grant execute on function nival_pr_private.verify_evidence(uuid,uuid,text) to npr_v2_auth;
create function nival_pr_private.customer_card(b uuid,h text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'name',c.name,'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=c.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now()
$$;
revoke all on function nival_pr_private.customer_card(uuid,text) from public;
grant execute on function nival_pr_private.customer_card(uuid,text) to npr_v2_auth;
create or replace function nival_pr_private.public_business(sl text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'active',b.status='activo' and (b.paid_until>now() or b.trial_ends_at>now()),'google_maps_url',b.google_maps_url,'program',jsonb_build_object('id',p.id,'name',p.name,'color',p.color,'logo_url',p.logo_url,'mode',p.mode),'rewards',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'points_cost',r.points_cost) order by r.position,r.id) from nival_pr.rewards r where r.program_id=p.id and r.active),'[]'::jsonb)) from nival_pr.businesses b left join nival_pr.programs p on p.business_id=b.id where b.slug=sl
$$;
create or replace function nival_pr_private.enroll_customer(sl text,n text,ph text,h text) returns uuid language plpgsql security definer set search_path='' as $$ declare b uuid;c uuid;begin
 if h !~ '^[a-f0-9]{64}$' or length(trim(n)) not between 1 and 100 or ph !~ '^52[0-9]{10}$' then raise exception 'Invalid registration';end if;
 select id into b from nival_pr.businesses where slug=sl and status='activo' and (paid_until>now() or trial_ends_at>now());if b is null then raise exception 'Inactive business';end if;
 insert into nival_pr.customers(business_id,name,phone,device_token_hash,token_expires_at,consent_at,consent_version) values(b,trim(n),ph,h,now()+interval '1 year',now(),'2026-10-05') returning id into c;return c;end $$;
create or replace function nival_pr_private.customer_token_valid(b uuid,h text) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from nival_pr.customers where business_id=b and device_token_hash=h and token_expires_at>now()) $$;
drop policy token_customer on nival_pr.customers;
create policy token_customer on nival_pr.customers for select to npr_v2_customer using(device_token_hash=nullif(current_setting('npr.device_token_hash',true),'') and consent_at is not null and token_expires_at>now());
create function nival_pr_private.issue_recovery(b uuid,c uuid,h text) returns void language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_staff_or_owner(b);
 if h !~ '^[a-f0-9]{64}$' or not exists(select 1 from nival_pr.customers where id=c and business_id=b) then raise exception 'Invalid customer';end if;
 update nival_pr_private.recovery_links set used_at=now() where customer_id=c and used_at is null;
 insert into nival_pr_private.recovery_links(token_hash,business_id,customer_id,issued_by) values(h,b,c,nival_pr.uid());
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id) values(nival_pr.uid(),'customer.recovery_issued','customers',c,b);end $$;
revoke all on function nival_pr_private.issue_recovery(uuid,uuid,text) from public;
grant execute on function nival_pr_private.issue_recovery(uuid,uuid,text) to npr_v2_auth;
create function nival_pr_private.consume_recovery(sl text,h text,new_h text) returns uuid language plpgsql security definer set search_path='' as $$ declare b uuid;c uuid;begin
 if new_h !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token';end if;
 update nival_pr_private.recovery_links r set used_at=now() from nival_pr.businesses bs where r.token_hash=h and r.business_id=bs.id and bs.slug=sl and r.used_at is null and r.expires_at>now() returning r.business_id,r.customer_id into b,c;
 if c is null then raise exception 'Link expired';end if;
 update nival_pr.customers set device_token_hash=new_h,token_expires_at=now()+interval '1 year' where id=c and business_id=b;return b;end $$;
revoke all on function nival_pr_private.consume_recovery(text,text,text) from public;
grant execute on function nival_pr_private.consume_recovery(text,text,text) to npr_v2_auth;
create function nival_pr_private.review_redemption(b uuid,d uuid,op text) returns void language plpgsql security definer set search_path='' as $$ declare l nival_pr.point_ledger;s text;c uuid;mode text;begin
 perform nival_pr_private.assert_owner(b);
 select pl.customer_id into c from nival_pr.redemptions rd join nival_pr.point_ledger pl on pl.id=rd.ledger_id where rd.id=d and pl.business_id=b;
 if c is null then raise exception 'Canje invalido';end if;
 perform 1 from nival_pr.customers where id=c for update;
 select pl.* into l from nival_pr.point_ledger pl join nival_pr.redemptions rd on rd.ledger_id=pl.id where rd.id=d and pl.business_id=b;
 select status into s from nival_pr.redemptions where id=d for update;
 if s='revertido' then raise exception 'Canje ya revertido';end if;
 if op='approve' then update nival_pr.redemptions set status='aprobado',reviewed_by=nival_pr.uid() where id=d;
 elsif op='reverse' then
  if exists(select 1 from nival_pr.point_ledger pl join nival_pr.redemptions rd on rd.ledger_id=pl.id where pl.customer_id=c and rd.status<>'revertido' and (pl.created_at,pl.id)>(l.created_at,l.id)) then raise exception 'Revierte primero el canje mas reciente';end if;
  insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reversal_of,note) values(b,c,'adjust',-l.points,nival_pr.uid(),l.id,'Reversion de canje por propietario');
  update nival_pr.redemptions set status='revertido',reviewed_by=nival_pr.uid() where id=d;
  select p.mode into mode from nival_pr.programs p where p.business_id=b;
  if mode='choose' then update nival_pr.customer_goals set locked=false where customer_id=c;
   insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,l.reward_id,true) on conflict(customer_id,reward_id) do update set locked=true;end if;
 else raise exception 'Operacion invalida';end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id) values(nival_pr.uid(),'redemption.'||op,'redemptions',d,b);end $$;
revoke all on function nival_pr_private.review_redemption(uuid,uuid,text) from public;
grant execute on function nival_pr_private.review_redemption(uuid,uuid,text) to npr_v2_auth;

-- Photos remain private in Neon; no Supabase project or secret required.
create table nival_pr_private.evidence_photos(path text primary key references nival_pr_private.evidence_uploads(path), data bytea not null check(octet_length(data) between 12 and 3145728), mime text not null check(mime in ('image/jpeg','image/png','image/webp')), created_at timestamptz not null default now());
alter table nival_pr_private.evidence_photos enable row level security;
revoke all on nival_pr_private.evidence_photos from public;
create function nival_pr_private.store_photo(b uuid,c uuid,path text,photo text,mime text) returns void language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.verify_evidence(b,c,path);
 insert into nival_pr_private.evidence_photos(path,data,mime) values(path,decode(photo,'base64'),mime);end $$;
revoke all on function nival_pr_private.store_photo(uuid,uuid,text,text,text) from public;
grant execute on function nival_pr_private.store_photo(uuid,uuid,text,text,text) to npr_v2_auth;
-- Only store_photo can create a verified evidence record from a real file.
revoke execute on function nival_pr_private.verify_evidence(uuid,uuid,text) from npr_v2_auth;
create function nival_pr_private.read_photo(d uuid) returns table(photo text,mime text) language plpgsql security definer set search_path='' as $$ declare b uuid;begin
 select l.business_id into b from nival_pr.redemptions rd join nival_pr.point_ledger l on l.id=rd.ledger_id where rd.id=d;
 perform nival_pr_private.assert_owner(b);
 return query select encode(e.data,'base64'),e.mime from nival_pr_private.evidence_photos e join nival_pr.redemptions rd on rd.photo_path=e.path where rd.id=d;end $$;
revoke all on function nival_pr_private.read_photo(uuid) from public;
grant execute on function nival_pr_private.read_photo(uuid) to npr_v2_auth;
commit;
