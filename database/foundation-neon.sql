-- Cimiento aprobado para Neon nival_puntos_resenas. Probar antes de aplicar.
-- No aplicar en Supabase: identidad y roles corresponden a Neon Auth.
-- No reemplaza ni importa automaticamente las tablas public.npr_*.
begin;
create schema nival_pr;
create schema nival_pr_private;
revoke all on schema nival_pr,nival_pr_private from public;
create role npr_v2_admin nologin;
create role npr_v2_owner nologin;
create role npr_v2_staff nologin;
create role npr_v2_customer nologin;
create role npr_v2_auth nologin;
do $$ begin execute format('grant npr_v2_admin,npr_v2_owner,npr_v2_staff,npr_v2_customer,npr_v2_auth to %I',current_user); end $$;
grant usage on schema nival_pr to npr_v2_admin,npr_v2_owner,npr_v2_staff,npr_v2_customer;
create function nival_pr.uid() returns uuid language sql stable security invoker set search_path='' as $$ select nullif(current_setting('npr.user_id',true),'')::uuid $$;
revoke all on function nival_pr.uid() from public;
grant execute on function nival_pr.uid() to npr_v2_admin,npr_v2_owner,npr_v2_staff;

create table nival_pr.profiles (id uuid primary key references neon_auth."user"(id), role text not null check(role in ('superadmin','owner','staff')), full_name text not null, phone text);
alter table nival_pr.profiles enable row level security;
revoke all on nival_pr.profiles from public;

create table nival_pr.plans (id uuid primary key default gen_random_uuid(), name text not null, price_mxn numeric(12,2) not null check(price_mxn>=0), interval text not null default 'month' check(interval in ('month','year','one_time')), features jsonb not null default '{}');
alter table nival_pr.plans enable row level security;
revoke all on nival_pr.plans from public;

create table nival_pr.businesses (id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), name text not null, giro text, owner_name text, phone text, email text, google_maps_url text, status text not null default 'registrado' check(status in ('registrado','cotizando','pago_pendiente','activo','por_vencer','pausado','cancelado')), plan_id uuid references nival_pr.plans(id), trial_ends_at timestamptz, paid_until timestamptz, notes text, created_at timestamptz not null default now());
alter table nival_pr.businesses enable row level security;
revoke all on nival_pr.businesses from public;

create table nival_pr.memberships (user_id uuid references nival_pr.profiles(id), business_id uuid references nival_pr.businesses(id), role text not null check(role in ('owner','staff')), pin_hash text, active boolean not null default true, primary key(user_id,business_id), check(role='staff' or pin_hash is null));
alter table nival_pr.memberships enable row level security;
revoke all on nival_pr.memberships from public;

create table nival_pr.payments (id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id), amount numeric(12,2) not null check(amount>0), method text not null check(method in ('efectivo','transferencia','mercado_pago','otro')), reference text, paid_at timestamptz not null default now(), period_start date not null, period_end date not null, registered_by uuid not null references nival_pr.profiles(id), check(period_end>=period_start));
alter table nival_pr.payments enable row level security;
revoke all on nival_pr.payments from public;

create table nival_pr.activation_codes (id uuid primary key default gen_random_uuid(), code text not null unique, business_id uuid references nival_pr.businesses(id), plan_id uuid not null references nival_pr.plans(id), expires_at timestamptz not null, used_at timestamptz, created_by uuid not null references nival_pr.profiles(id));
alter table nival_pr.activation_codes enable row level security;
revoke all on nival_pr.activation_codes from public;

create table nival_pr.programs (id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id), name text not null, color text not null default '#2563eb', logo_url text, mode text not null default 'single' check(mode in ('single','choose','sequence')), points_per_visit integer not null default 1 check(points_per_visit>0), rules jsonb not null default '{"min_hours_between_visits":4,"max_visits_per_day":2}', unique(id,business_id), unique(business_id), check(jsonb_typeof(rules)='object'), check(rules ?& array['min_hours_between_visits','max_visits_per_day']), check((rules->>'min_hours_between_visits')::numeric>=0), check((rules->>'max_visits_per_day')::integer>0));
alter table nival_pr.programs enable row level security;
revoke all on nival_pr.programs from public;

create table nival_pr.rewards (id uuid primary key default gen_random_uuid(), program_id uuid not null references nival_pr.programs(id), name text not null, points_cost integer not null check(points_cost>0), position integer not null check(position>=0), active boolean not null default true, unique(program_id,position));
alter table nival_pr.rewards enable row level security;
revoke all on nival_pr.rewards from public;

create table nival_pr.customers (id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id), phone text not null check(phone ~ '^[0-9]{10,15}$'), name text not null, device_token_hash text unique, consent_at timestamptz, created_at timestamptz not null default now(), unique(business_id,phone), unique(id,business_id));
alter table nival_pr.customers enable row level security;
revoke all on nival_pr.customers from public;

create table nival_pr.customer_goals (customer_id uuid references nival_pr.customers(id), reward_id uuid references nival_pr.rewards(id), locked boolean not null default false, primary key(customer_id,reward_id));
alter table nival_pr.customer_goals enable row level security;
revoke all on nival_pr.customer_goals from public;

create table nival_pr.point_ledger (id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id), customer_id uuid not null, type text not null check(type in ('visit','redeem','adjust')), points integer not null check(points<>0), staff_id uuid not null references nival_pr.profiles(id), note text, reward_id uuid references nival_pr.rewards(id), reversal_of uuid unique references nival_pr.point_ledger(id), created_at timestamptz not null default now(), foreign key(customer_id,business_id) references nival_pr.customers(id,business_id), unique(id,business_id), check((type='visit' and points>0 and reward_id is null) or (type='redeem' and points<0 and reward_id is not null) or type='adjust'));
alter table nival_pr.point_ledger enable row level security;
revoke all on nival_pr.point_ledger from public;

create table nival_pr.redemptions (id uuid primary key default gen_random_uuid(), ledger_id uuid not null unique references nival_pr.point_ledger(id), reward_id uuid not null references nival_pr.rewards(id), photo_path text, status text not null default 'pendiente' check(status in ('pendiente','aprobado','revertido')), reviewed_by uuid references nival_pr.profiles(id));
alter table nival_pr.redemptions enable row level security;
revoke all on nival_pr.redemptions from public;

create table nival_pr.review_reports (id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id), period date not null check(extract(day from period)=1), rating numeric(2,1) check(rating between 1 and 5), total_reviews integer not null check(total_reviews>=0), new_reviews integer not null check(new_reviews>=0), answered integer not null check(answered>=0), distribution jsonb not null default '{}', profile_checklist jsonb not null default '{}', notes text, created_by uuid not null references nival_pr.profiles(id), unique(business_id,period));
alter table nival_pr.review_reports enable row level security;
revoke all on nival_pr.review_reports from public;

create table nival_pr.changelog (id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id), date timestamptz not null default now(), description text not null);
alter table nival_pr.changelog enable row level security;
revoke all on nival_pr.changelog from public;

create table nival_pr.tasks (id uuid primary key default gen_random_uuid(), business_id uuid references nival_pr.businesses(id), title text not null, status text not null default 'pendiente' check(status in ('pendiente','en_progreso','completada','cancelada')), due_date date, recurrence text check(recurrence in ('daily','weekly','monthly')), created_at timestamptz not null default now());
alter table nival_pr.tasks enable row level security;
revoke all on nival_pr.tasks from public;

create table nival_pr.site_content (key text primary key, value_draft jsonb not null default '{}', value_published jsonb, published_at timestamptz);
alter table nival_pr.site_content enable row level security;
revoke all on nival_pr.site_content from public;

create table nival_pr.short_links (code text primary key check(code ~ '^[A-Za-z0-9_-]{3,64}$'), target_url text not null check(target_url ~ '^https://'), business_id uuid references nival_pr.businesses(id));
alter table nival_pr.short_links enable row level security;
revoke all on nival_pr.short_links from public;

create table nival_pr.advice_templates (id uuid primary key default gen_random_uuid(), segment text not null, text text not null);
alter table nival_pr.advice_templates enable row level security;
revoke all on nival_pr.advice_templates from public;

create table nival_pr.audit_log (id uuid primary key default gen_random_uuid(), actor_id uuid references nival_pr.profiles(id), action text not null, entity text not null, entity_id uuid, business_id uuid references nival_pr.businesses(id), data jsonb not null default '{}', created_at timestamptz not null default now());
alter table nival_pr.audit_log enable row level security;
revoke all on nival_pr.audit_log from public;

-- Helpers invoker: memberships solo permite leer la propia identidad.
create function nival_pr.has_business(b uuid) returns boolean language sql stable security invoker set search_path='' as $$
select exists(select 1 from nival_pr.memberships where business_id=b and user_id=nival_pr.uid() and active and role=case when current_user='npr_v2_staff' then 'staff' else 'owner' end)
$$;
revoke all on function nival_pr.has_business(uuid) from public;
grant execute on function nival_pr.has_business(uuid) to npr_v2_owner,npr_v2_staff;
grant select(user_id,business_id,role,active) on nival_pr.memberships to npr_v2_owner,npr_v2_staff;
create policy own_membership on nival_pr.memberships for select to npr_v2_owner,npr_v2_staff using(user_id=nival_pr.uid());
create policy own_profile on nival_pr.profiles for select to npr_v2_owner,npr_v2_staff using(id=nival_pr.uid());
grant select on nival_pr.profiles to npr_v2_owner,npr_v2_staff;
grant select,insert,update,delete on nival_pr.profiles to npr_v2_admin;
create policy admin_all on nival_pr.profiles to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.plans to npr_v2_admin;
create policy admin_all on nival_pr.plans to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.businesses to npr_v2_admin;
create policy admin_all on nival_pr.businesses to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.memberships to npr_v2_admin;
create policy admin_all on nival_pr.memberships to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.payments to npr_v2_admin;
create policy admin_all on nival_pr.payments to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.activation_codes to npr_v2_admin;
create policy admin_all on nival_pr.activation_codes to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.programs to npr_v2_admin;
create policy admin_all on nival_pr.programs to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.rewards to npr_v2_admin;
create policy admin_all on nival_pr.rewards to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.customers to npr_v2_admin;
create policy admin_all on nival_pr.customers to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.customer_goals to npr_v2_admin;
create policy admin_all on nival_pr.customer_goals to npr_v2_admin using(true) with check(true);
grant select,insert on nival_pr.point_ledger to npr_v2_admin;
create policy admin_all on nival_pr.point_ledger to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.redemptions to npr_v2_admin;
create policy admin_all on nival_pr.redemptions to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.review_reports to npr_v2_admin;
create policy admin_all on nival_pr.review_reports to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.changelog to npr_v2_admin;
create policy admin_all on nival_pr.changelog to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.tasks to npr_v2_admin;
create policy admin_all on nival_pr.tasks to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.site_content to npr_v2_admin;
create policy admin_all on nival_pr.site_content to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.short_links to npr_v2_admin;
create policy admin_all on nival_pr.short_links to npr_v2_admin using(true) with check(true);
grant select,insert,update,delete on nival_pr.advice_templates to npr_v2_admin;
create policy admin_all on nival_pr.advice_templates to npr_v2_admin using(true) with check(true);
grant select,insert on nival_pr.audit_log to npr_v2_admin;
create policy admin_all on nival_pr.audit_log to npr_v2_admin using(true) with check(true);
create policy owner_read on nival_pr.businesses for select to npr_v2_owner using(nival_pr.has_business(id));
grant select on nival_pr.businesses to npr_v2_owner;
create policy owner_read on nival_pr.payments for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.payments to npr_v2_owner;
create policy owner_read on nival_pr.programs for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.programs to npr_v2_owner;
create policy owner_read on nival_pr.customers for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select(id,business_id,phone,name,consent_at,created_at) on nival_pr.customers to npr_v2_owner;
create policy owner_read on nival_pr.point_ledger for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.point_ledger to npr_v2_owner;
create policy owner_read on nival_pr.review_reports for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.review_reports to npr_v2_owner;
create policy owner_read on nival_pr.changelog for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.changelog to npr_v2_owner;
create policy owner_read on nival_pr.tasks for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.tasks to npr_v2_owner;
create policy owner_read on nival_pr.short_links for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.short_links to npr_v2_owner;
create policy owner_read on nival_pr.audit_log for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select on nival_pr.audit_log to npr_v2_owner;
create policy owner_read on nival_pr.rewards for select to npr_v2_owner using(nival_pr.has_business((select p.business_id from nival_pr.programs p where p.id=program_id)));
grant select on nival_pr.rewards to npr_v2_owner;
create policy owner_read on nival_pr.customer_goals for select to npr_v2_owner using(nival_pr.has_business((select c.business_id from nival_pr.customers c where c.id=customer_id)));
grant select on nival_pr.customer_goals to npr_v2_owner;
create policy owner_read on nival_pr.redemptions for select to npr_v2_owner using(nival_pr.has_business((select l.business_id from nival_pr.point_ledger l where l.id=ledger_id)));
grant select on nival_pr.redemptions to npr_v2_owner;
grant insert on nival_pr.programs to npr_v2_owner;
grant update(name,color,logo_url,mode,points_per_visit,rules) on nival_pr.programs to npr_v2_owner;
create policy owner_write on nival_pr.programs for all to npr_v2_owner using(nival_pr.has_business(business_id)) with check(nival_pr.has_business(business_id));
grant insert,delete on nival_pr.rewards to npr_v2_owner;
grant update(name,points_cost,position,active) on nival_pr.rewards to npr_v2_owner;
create policy owner_write on nival_pr.rewards for all to npr_v2_owner using(nival_pr.has_business((select p.business_id from nival_pr.programs p where p.id=program_id))) with check(nival_pr.has_business((select p.business_id from nival_pr.programs p where p.id=program_id)));
grant insert,update,delete on nival_pr.customer_goals to npr_v2_owner;
create policy owner_write on nival_pr.customer_goals for all to npr_v2_owner using(nival_pr.has_business((select c.business_id from nival_pr.customers c where c.id=customer_id))) with check(nival_pr.has_business((select c.business_id from nival_pr.customers c where c.id=customer_id)));
grant insert(id,business_id,phone,name,consent_at),update(phone,name,consent_at) on nival_pr.customers to npr_v2_owner;
create policy owner_customer_insert on nival_pr.customers for insert to npr_v2_owner with check(nival_pr.has_business(business_id));
create policy owner_customer_update on nival_pr.customers for update to npr_v2_owner using(nival_pr.has_business(business_id)) with check(nival_pr.has_business(business_id));
grant update(name,giro,owner_name,phone,email,google_maps_url) on nival_pr.businesses to npr_v2_owner;
create policy owner_business_update on nival_pr.businesses for update to npr_v2_owner using(nival_pr.has_business(id)) with check(nival_pr.has_business(id));
grant select on nival_pr.plans,nival_pr.advice_templates to npr_v2_owner;
create policy plans_read on nival_pr.plans for select to npr_v2_owner using(true);
create policy advice_read on nival_pr.advice_templates for select to npr_v2_owner using(true);
create policy staff_read on nival_pr.programs for select to npr_v2_staff using(nival_pr.has_business(business_id));
grant select on nival_pr.programs to npr_v2_staff;
create policy staff_read on nival_pr.rewards for select to npr_v2_staff using(nival_pr.has_business((select p.business_id from nival_pr.programs p where p.id=program_id)));
grant select on nival_pr.rewards to npr_v2_staff;
create policy staff_read on nival_pr.customers for select to npr_v2_staff using(nival_pr.has_business(business_id));
grant select(id,business_id,name,created_at) on nival_pr.customers to npr_v2_staff;
create policy staff_read on nival_pr.point_ledger for select to npr_v2_staff using(nival_pr.has_business(business_id));
grant select on nival_pr.point_ledger to npr_v2_staff;
create policy staff_read on nival_pr.redemptions for select to npr_v2_staff using(nival_pr.has_business((select l.business_id from nival_pr.point_ledger l where l.id=ledger_id)));
grant select on nival_pr.redemptions to npr_v2_staff;
grant select(id,name,slug,status) on nival_pr.businesses to npr_v2_staff;
create policy staff_business_read on nival_pr.businesses for select to npr_v2_staff using(nival_pr.has_business(id));
grant insert on nival_pr.point_ledger to npr_v2_owner,npr_v2_staff;
create policy ledger_insert on nival_pr.point_ledger for insert to npr_v2_owner,npr_v2_staff with check(nival_pr.has_business(business_id) and staff_id=nival_pr.uid() and type in ('visit','redeem'));
-- Customer capability: digest calculado por servidor tras validar cookie; nunca por datos de formulario.
grant select(id,business_id) on nival_pr.customers to npr_v2_customer;
create policy token_customer on nival_pr.customers for select to npr_v2_customer using(device_token_hash=nullif(current_setting('npr.device_token_hash',true),'') and consent_at is not null);
grant select(customer_id,points,created_at,id,business_id) on nival_pr.point_ledger to npr_v2_customer;
create policy token_ledger on nival_pr.point_ledger for select to npr_v2_customer using(exists(select 1 from nival_pr.customers c where c.id=customer_id and c.business_id=point_ledger.business_id));
-- Helpers de integridad internos. Sin endpoints publicos ni grants EXECUTE.
create function nival_pr_private.immutable() returns trigger language plpgsql security invoker set search_path='' as $$ begin raise exception 'Registro inmutable: agregue un ajuste compensatorio'; end $$;
revoke all on function nival_pr_private.immutable() from public;
create trigger immutable_ledger before update or delete or truncate on nival_pr.point_ledger for each statement execute function nival_pr_private.immutable();
create trigger immutable_audit before update or delete or truncate on nival_pr.audit_log for each statement execute function nival_pr_private.immutable();
create function nival_pr.point_balance(c uuid) returns bigint language sql stable security invoker set search_path='' as $$ select coalesce(sum(points),0)::bigint from nival_pr.point_ledger where customer_id=c $$;
revoke all on function nival_pr.point_balance(uuid) from public;
grant execute on function nival_pr.point_balance(uuid) to npr_v2_admin,npr_v2_owner,npr_v2_staff,npr_v2_customer;
create function nival_pr_private.guard_movement() returns trigger language plpgsql security definer set search_path='' as $$
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
  select points_cost into cost from nival_pr.rewards where id=new.reward_id and program_id=p.id and active;
  if cost is null or new.points<>-cost then raise exception 'Premio invalido'; end if;
  if p.mode='single' and new.reward_id<>(select id from nival_pr.rewards where program_id=p.id and active order by position limit 1) then raise exception 'Premio fuera del modo single'; end if;
  if p.mode='choose' and not exists(select 1 from nival_pr.customer_goals where customer_id=new.customer_id and reward_id=new.reward_id and locked) then raise exception 'Selecciona tu meta antes de canjear'; end if;
  if p.mode='sequence' and new.reward_id is distinct from (select r.id from nival_pr.rewards r where r.program_id=p.id and r.active and not exists(select 1 from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id where l.customer_id=new.customer_id and d.reward_id=r.id and d.status<>'revertido') order by r.position limit 1) then raise exception 'Premio fuera de secuencia'; end if;
 elsif new.type='adjust' then
  if new.reversal_of is not null and not exists(select 1 from nival_pr.point_ledger l where l.id=new.reversal_of and l.customer_id=new.customer_id and l.business_id=new.business_id and l.type='redeem' and new.points=-l.points) then raise exception 'Reversion invalida'; end if;
 end if;
 if balance+new.points<0 then raise exception 'Saldo insuficiente'; end if;
 return new;
end $$;
revoke all on function nival_pr_private.guard_movement() from public;
create trigger guard_movement before insert on nival_pr.point_ledger for each row execute function nival_pr_private.guard_movement();
create function nival_pr_private.create_redemption() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.type='redeem' then insert into nival_pr.redemptions(ledger_id,reward_id) values(new.id,new.reward_id); end if;
 return new;
end $$;
revoke all on function nival_pr_private.create_redemption() from public;
create trigger redemption_insert after insert on nival_pr.point_ledger for each row execute function nival_pr_private.create_redemption();
create function nival_pr_private.audit_status() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if old.status is distinct from new.status then
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data) values(nival_pr.uid(),'business.status_changed','businesses',new.id,new.id,jsonb_build_object('old',old.status,'new',new.status));
 end if; return new;
end $$;
revoke all on function nival_pr_private.audit_status() from public;
create trigger business_status_audit after update of status on nival_pr.businesses for each row execute function nival_pr_private.audit_status();
-- FK compuestas o triggers evitan mezclar negocios indirectamente.
create function nival_pr_private.guard_goal() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from nival_pr.customers c join nival_pr.rewards r on r.id=new.reward_id join nival_pr.programs p on p.id=r.program_id where c.id=new.customer_id and c.business_id=p.business_id) then raise exception 'Premio de otro negocio'; end if;
 return new;
end $$;
revoke all on function nival_pr_private.guard_goal() from public;
create trigger goal_guard before insert or update on nival_pr.customer_goals for each row execute function nival_pr_private.guard_goal();
create index profiles_idx_0 on nival_pr.profiles(role);
create index businesses_idx_0 on nival_pr.businesses(plan_id);
create index businesses_idx_1 on nival_pr.businesses(status,paid_until);
create index memberships_idx_0 on nival_pr.memberships(business_id,user_id);
create index payments_idx_0 on nival_pr.payments(business_id,paid_at desc);
create index payments_idx_1 on nival_pr.payments(registered_by);
create index activation_codes_idx_0 on nival_pr.activation_codes(business_id);
create index activation_codes_idx_1 on nival_pr.activation_codes(plan_id);
create index activation_codes_idx_2 on nival_pr.activation_codes(created_by);
create index activation_codes_idx_3 on nival_pr.activation_codes(expires_at);
create index customer_goals_idx_0 on nival_pr.customer_goals(reward_id);
create index point_ledger_idx_0 on nival_pr.point_ledger(customer_id,created_at desc);
create index point_ledger_idx_1 on nival_pr.point_ledger(business_id,created_at desc);
create index point_ledger_idx_2 on nival_pr.point_ledger(staff_id);
create index point_ledger_idx_3 on nival_pr.point_ledger(reward_id);
create index redemptions_idx_0 on nival_pr.redemptions(reward_id);
create index redemptions_idx_1 on nival_pr.redemptions(reviewed_by);
create index redemptions_idx_2 on nival_pr.redemptions(status);
create index review_reports_idx_0 on nival_pr.review_reports(created_by);
create index changelog_idx_0 on nival_pr.changelog(business_id,date desc);
create index tasks_idx_0 on nival_pr.tasks(business_id,status,due_date);
create index tasks_idx_1 on nival_pr.tasks(status,due_date);
create index short_links_idx_0 on nival_pr.short_links(business_id);
create index advice_templates_idx_0 on nival_pr.advice_templates(segment);
create index audit_log_idx_0 on nival_pr.audit_log(business_id,created_at desc);
create index audit_log_idx_1 on nival_pr.audit_log(actor_id,created_at desc);
create index audit_log_idx_2 on nival_pr.audit_log(entity,entity_id);
insert into nival_pr.plans(name,price_mxn,interval,features) values('Nival Tech completo',399,'month','{"puntos":true,"resenas_manuales":true}');

-- Funciones de identidad y PIN solo accesibles al servidor mediante rol dedicado.
grant usage on schema nival_pr,nival_pr_private to npr_v2_auth;
grant execute on function nival_pr.uid() to npr_v2_auth;
grant select(id,role,full_name,phone) on nival_pr.profiles to npr_v2_auth;
create policy identity_self on nival_pr.profiles for select to npr_v2_auth using(id=nival_pr.uid());
grant select(user_id,business_id,role,active) on nival_pr.memberships to npr_v2_auth;
create policy identity_membership_self on nival_pr.memberships for select to npr_v2_auth using(user_id=nival_pr.uid());

create table nival_pr_private.login_limits(key_hash text primary key, attempts integer not null, window_started_at timestamptz not null);
alter table nival_pr_private.login_limits enable row level security;
revoke all on nival_pr_private.login_limits from public;
create table nival_pr_private.staff_sessions(token_hash text primary key, user_id uuid not null references nival_pr.profiles(id), business_id uuid not null references nival_pr.businesses(id), pin_snapshot text not null, expires_at timestamptz not null);
create index staff_session_expiry on nival_pr_private.staff_sessions(expires_at);
create index staff_session_identity on nival_pr_private.staff_sessions(user_id,business_id);
alter table nival_pr_private.staff_sessions enable row level security;
revoke all on nival_pr_private.staff_sessions from public;

create function nival_pr_private.claim_pin_attempt(k text) returns boolean language plpgsql security definer set search_path='' as $$
declare accepted boolean;
begin
 if k !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate key'; end if;
 insert into nival_pr_private.login_limits(key_hash,attempts,window_started_at) values(k,1,now())
 on conflict(key_hash) do update set attempts=case when login_limits.window_started_at<now()-interval '15 minutes' then 1 else login_limits.attempts+1 end, window_started_at=case when login_limits.window_started_at<now()-interval '15 minutes' then now() else login_limits.window_started_at end
 returning attempts<=5 into accepted;
 return accepted;
end $$;
create function nival_pr_private.pin_identity(sl text,u uuid) returns table(user_id uuid,business_id uuid,pin_hash text) language sql stable security definer set search_path='' as $$
 select m.user_id,m.business_id,m.pin_hash from nival_pr.memberships m join nival_pr.profiles p on p.id=m.user_id join nival_pr.businesses b on b.id=m.business_id where m.user_id=u and b.slug=sl and m.role='staff' and p.role='staff' and m.active and b.status='activo'
$$;
create function nival_pr_private.issue_staff_session(u uuid,b uuid,h text) returns void language plpgsql security definer set search_path='' as $$
declare pin text;
begin
 if h !~ '^[a-f0-9]{64}$' then raise exception 'Invalid session'; end if;
 select m.pin_hash into pin from nival_pr.memberships m join nival_pr.profiles p on p.id=m.user_id where m.user_id=u and m.business_id=b and m.active and m.role='staff' and p.role='staff';
 if pin is null then raise exception 'Inactive staff'; end if;
 insert into nival_pr_private.staff_sessions(token_hash,user_id,business_id,pin_snapshot,expires_at) values(h,u,b,pin,now()+interval '8 hours');
end $$;
create function nival_pr_private.staff_session(h text) returns table(user_id uuid,business_id uuid,full_name text) language sql stable security definer set search_path='' as $$
 select s.user_id,s.business_id,p.full_name from nival_pr_private.staff_sessions s join nival_pr.memberships m on m.user_id=s.user_id and m.business_id=s.business_id join nival_pr.profiles p on p.id=s.user_id where s.token_hash=h and s.expires_at>now() and m.active and m.role='staff' and p.role='staff' and m.pin_hash=s.pin_snapshot
$$;
create function nival_pr_private.revoke_staff_session(h text) returns void language sql volatile security definer set search_path='' as $$ delete from nival_pr_private.staff_sessions where token_hash=h $$;
-- Owner inscrito tras sesion de correo validada. Nunca se asigna superadmin desde la web.
create function nival_pr_private.ensure_owner(n text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=nival_pr.uid();
begin
 if u is null then raise exception 'Login required'; end if;
 insert into nival_pr.profiles(id,role,full_name) values(u,'owner',left(coalesce(nullif(n,''),'Propietario'),120)) on conflict(id) do nothing;
end $$;
-- Auto-registro atomico: rol owner verificado y membresia del mismo actor.
create function nival_pr_private.register_business(sl text,n text,g text) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=nival_pr.uid(); b uuid;
begin
 if not exists(select 1 from nival_pr.profiles where id=u and role='owner') then raise exception 'Owner required'; end if;
 if length(trim(n)) not between 1 and 150 then raise exception 'Invalid name'; end if;
 insert into nival_pr.businesses(slug,name,giro,plan_id) values(sl,trim(n),left(g,100),(select id from nival_pr.plans order by name limit 1)) returning id into b;
 insert into nival_pr.memberships(user_id,business_id,role) values(u,b,'owner');
 return b;
end $$;

revoke all on function nival_pr_private.claim_pin_attempt(text) from public;
grant execute on function nival_pr_private.claim_pin_attempt(text) to npr_v2_auth;
revoke all on function nival_pr_private.pin_identity(text,uuid) from public;
grant execute on function nival_pr_private.pin_identity(text,uuid) to npr_v2_auth;
revoke all on function nival_pr_private.issue_staff_session(uuid,uuid,text) from public;
grant execute on function nival_pr_private.issue_staff_session(uuid,uuid,text) to npr_v2_auth;
revoke all on function nival_pr_private.staff_session(text) from public;
grant execute on function nival_pr_private.staff_session(text) to npr_v2_auth;
revoke all on function nival_pr_private.revoke_staff_session(text) from public;
grant execute on function nival_pr_private.revoke_staff_session(text) to npr_v2_auth;
revoke all on function nival_pr_private.ensure_owner(text) from public;
grant execute on function nival_pr_private.ensure_owner(text) to npr_v2_auth;
revoke all on function nival_pr_private.register_business(text,text,text) from public;
grant execute on function nival_pr_private.register_business(text,text,text) to npr_v2_auth;

create function nival_pr_private.public_business(sl text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'active',b.status='activo' and (b.paid_until>now() or b.trial_ends_at>now()),'google_maps_url',b.google_maps_url,'program',jsonb_build_object('id',p.id,'name',p.name,'color',p.color,'mode',p.mode),'rewards',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'points_cost',r.points_cost) order by r.position) from nival_pr.rewards r where r.program_id=p.id and r.active),'[]'::jsonb)) from nival_pr.businesses b left join nival_pr.programs p on p.business_id=b.id where b.slug=sl
$$;
create function nival_pr_private.enroll_customer(sl text,n text,ph text,h text) returns uuid language plpgsql security definer set search_path='' as $$
declare b uuid; c uuid;
begin
 if h !~ '^[a-f0-9]{64}$' or length(trim(n)) not between 1 and 100 then raise exception 'Invalid registration'; end if;
 select id into b from nival_pr.businesses where slug=sl and status='activo' and (paid_until>now() or trial_ends_at>now());
 if b is null then raise exception 'Inactive business'; end if;
 insert into nival_pr.customers(business_id,name,phone,device_token_hash,consent_at) values(b,trim(n),ph,h,now()) returning id into c;
 -- Una coincidencia de telefono NO concede acceso: sin OTP se requiere ayuda del owner.
 return c;
end $$;
create function nival_pr_private.customer_token_valid(b uuid,h text) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from nival_pr.customers where business_id=b and device_token_hash=h) $$;
create function nival_pr_private.rotate_customer_token(b uuid,c uuid,h text) returns void language plpgsql security definer set search_path='' as $$
begin
 if h is not null and h !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token'; end if;
 if not exists(select 1 from nival_pr.profiles where id=nival_pr.uid() and role='superadmin') and not exists(select 1 from nival_pr.memberships where user_id=nival_pr.uid() and business_id=b and role='owner' and active) then raise exception 'Owner required'; end if;
 update nival_pr.customers set device_token_hash=h where id=c and business_id=b;
 if not found then raise exception 'Customer not found'; end if;
end $$;
-- Evita usar IDs de ledger ajenos o modificar un canje en contradiccion con el movimiento.
create function nival_pr_private.guard_redemption() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from nival_pr.point_ledger l where l.id=new.ledger_id and l.type='redeem' and l.reward_id=new.reward_id) then raise exception 'Invalid redemption ledger'; end if;
 if tg_op='UPDATE' and (new.ledger_id<>old.ledger_id or new.reward_id<>old.reward_id) then raise exception 'Redemption identity immutable'; end if;
 if new.status='revertido' and not exists(select 1 from nival_pr.point_ledger l where l.reversal_of=new.ledger_id and l.type='adjust') then raise exception 'Compensating entry required'; end if;
 return new;
end $$;
revoke all on function nival_pr_private.guard_redemption() from public;
create trigger redemption_guard before insert or update on nival_pr.redemptions for each row execute function nival_pr_private.guard_redemption();
revoke all on function nival_pr_private.public_business(text) from public;
grant execute on function nival_pr_private.public_business(text) to npr_v2_auth;
revoke all on function nival_pr_private.enroll_customer(text,text,text,text) from public;
grant execute on function nival_pr_private.enroll_customer(text,text,text,text) to npr_v2_auth;
revoke all on function nival_pr_private.customer_token_valid(uuid,text) from public;
grant execute on function nival_pr_private.customer_token_valid(uuid,text) to npr_v2_auth;
revoke all on function nival_pr_private.rotate_customer_token(uuid,uuid,text) from public;
grant execute on function nival_pr_private.rotate_customer_token(uuid,uuid,text) to npr_v2_auth;

create function nival_pr_private.consent_customer(b uuid,h text) returns void language plpgsql security definer set search_path='' as $$ begin
 update nival_pr.customers set consent_at=coalesce(consent_at,now()) where business_id=b and device_token_hash=h;
 if not found then raise exception 'Invalid token'; end if;
end $$;
revoke all on function nival_pr_private.consent_customer(uuid,text) from public;
grant execute on function nival_pr_private.consent_customer(uuid,text) to npr_v2_auth;

create unique index one_locked_goal on nival_pr.customer_goals(customer_id) where locked;
create function nival_pr_private.choose_goal(b uuid,h text,r uuid) returns void language plpgsql security definer set search_path='' as $$
declare c uuid;
begin
 select id into c from nival_pr.customers where business_id=b and device_token_hash=h and consent_at is not null;
 if c is null then raise exception 'Invalid token'; end if;
 if not exists(select 1 from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id where rw.id=r and rw.active and p.business_id=b and p.mode='choose') then raise exception 'Invalid reward'; end if;
 if exists(select 1 from nival_pr.customer_goals where customer_id=c and locked and reward_id<>r) then raise exception 'Goal locked'; end if;
 insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true) on conflict(customer_id,reward_id) do update set locked=true;
end $$;
revoke all on function nival_pr_private.choose_goal(uuid,text,uuid) from public;
grant execute on function nival_pr_private.choose_goal(uuid,text,uuid) to npr_v2_auth;
commit;
