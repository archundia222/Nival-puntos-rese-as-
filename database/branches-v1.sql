-- Multi-branch management with a default branch for every existing and new business.
begin;
create table if not exists nival_pr.branches(
 id uuid primary key default gen_random_uuid(),business_id uuid not null references nival_pr.businesses(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),code text not null check(code ~ '^[a-f0-9]{8}$'),
 active boolean not null default true,is_primary boolean not null default false,created_at timestamptz not null default now(),
 unique(id,business_id),unique(business_id,code)
);
create unique index if not exists branches_one_primary on nival_pr.branches(business_id) where is_primary;
alter table nival_pr.branches enable row level security;
revoke all on nival_pr.branches from public;
grant select,insert,update,delete on nival_pr.branches to npr_v2_admin;
create policy branches_admin_all on nival_pr.branches to npr_v2_admin using(true) with check(true);

insert into nival_pr.branches(business_id,name,code,is_primary)
 select b.id,b.name,substr(replace(gen_random_uuid()::text,'-',''),1,8),true from nival_pr.businesses b
 where not exists(select 1 from nival_pr.branches x where x.business_id=b.id);

create or replace function nival_pr_private.create_default_branch() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into nival_pr.branches(business_id,name,code,is_primary)
 values(new.id,new.name,substr(replace(gen_random_uuid()::text,'-',''),1,8),true);
 return new;
end $$;
revoke all on function nival_pr_private.create_default_branch() from public;
drop trigger if exists business_default_branch on nival_pr.businesses;
create trigger business_default_branch after insert on nival_pr.businesses
 for each row execute function nival_pr_private.create_default_branch();

alter table nival_pr.memberships add column if not exists branch_id uuid;
update nival_pr.memberships m set branch_id=b.id from nival_pr.branches b
 where b.business_id=m.business_id and b.is_primary and m.role='staff' and m.branch_id is null;
create index if not exists memberships_branch on nival_pr.memberships(branch_id) where role='staff';
do $$ begin
 alter table nival_pr.memberships add constraint memberships_branch_business_fk
  foreign key(branch_id,business_id) references nival_pr.branches(id,business_id);
exception when duplicate_object then null; end $$;
do $$ begin
 alter table nival_pr.memberships add constraint memberships_branch_role_check
  check((role='owner' and branch_id is null) or (role='staff' and branch_id is not null));
exception when duplicate_object then null; end $$;

alter table nival_pr.point_ledger add column if not exists branch_id uuid;
-- Keep the immutable ledger intact; legacy movements have no branch attribution.
do $$ begin
 alter table nival_pr.point_ledger add constraint ledger_branch_business_fk
  foreign key(branch_id,business_id) references nival_pr.branches(id,business_id);
exception when duplicate_object then null; end $$;
create index if not exists ledger_branch_period on nival_pr.point_ledger(branch_id,created_at desc);

create or replace function nival_pr_private.assign_movement_branch() returns trigger
language plpgsql security definer set search_path='' as $$
declare assigned uuid;
begin
 if exists(select 1 from nival_pr.memberships where user_id=nival_pr.uid() and business_id=new.business_id and role='staff' and active) then
  select branch_id into assigned from nival_pr.memberships where user_id=nival_pr.uid()
   and business_id=new.business_id and role='staff' and active;
  if assigned is null then raise exception 'Empleado sin sucursal activa'; end if;
  if new.branch_id is not null and new.branch_id<>assigned then raise exception 'Sucursal no autorizada'; end if;
  new.branch_id=assigned;
 else
  if new.branch_id is null then select id into new.branch_id from nival_pr.branches
   where business_id=new.business_id and is_primary and active; end if;
  if not exists(select 1 from nival_pr.branches where id=new.branch_id and business_id=new.business_id and active) then
   raise exception 'Sucursal inválida o inactiva'; end if;
 end if;
 return new;
end $$;
revoke all on function nival_pr_private.assign_movement_branch() from public;
drop trigger if exists ledger_branch_scope on nival_pr.point_ledger;
create trigger ledger_branch_scope before insert on nival_pr.point_ledger
 for each row execute function nival_pr_private.assign_movement_branch();

drop function if exists nival_pr_private.list_staff(uuid);
create function nival_pr_private.list_staff(b uuid)
returns table(id uuid,name text,active boolean,branch_id uuid,branch_name text,branch_code text)
language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_owner(b);
 return query select p.id,p.full_name,m.active,m.branch_id,br.name,br.code from nival_pr.memberships m
 join nival_pr.profiles p on p.id=m.user_id left join nival_pr.branches br on br.id=m.branch_id
 where m.business_id=b and m.role='staff' order by p.full_name;
end $$;
revoke all on function nival_pr_private.list_staff(uuid) from public;
grant execute on function nival_pr_private.list_staff(uuid) to npr_v2_auth;

create or replace function nival_pr_private.list_branches(b uuid)
returns table(id uuid,name text,code text,active boolean,is_primary boolean,staff_count integer)
language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_owner(b);
 return query select br.id,br.name,br.code,br.active,br.is_primary,
  (select count(*)::int from nival_pr.memberships m where m.branch_id=br.id and m.role='staff')
 from nival_pr.branches br where br.business_id=b order by br.is_primary desc,br.created_at,br.name;
end $$;
revoke all on function nival_pr_private.list_branches(uuid) from public;
grant execute on function nival_pr_private.list_branches(uuid) to npr_v2_auth;

create or replace function nival_pr_private.manage_branch(b uuid,br uuid,n text,a boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare found_id uuid; active_n integer;
begin
 perform nival_pr_private.assert_owner(b);perform 1 from nival_pr.businesses where id=b for update;
 if br is null then
  if length(trim(n)) not between 1 and 120 then raise exception 'Nombre de sucursal inválido'; end if;
  select count(*) into active_n from nival_pr.branches where business_id=b and active;
  if active_n>=10 then raise exception 'Máximo 10 sucursales activas'; end if;
  insert into nival_pr.branches(business_id,name,code) values(b,trim(n),substr(replace(gen_random_uuid()::text,'-',''),1,8)) returning id into found_id;
 else
  select id into found_id from nival_pr.branches where id=br and business_id=b for update;
  if found_id is null then raise exception 'Sucursal no encontrada'; end if;
  if not a and exists(select 1 from nival_pr.branches where id=br and is_primary) then raise exception 'La sucursal principal no se puede desactivar'; end if;
  if a then select count(*) into active_n from nival_pr.branches where business_id=b and active and id<>br;
   if active_n>=10 then raise exception 'Máximo 10 sucursales activas'; end if; end if;
  if n is not null and length(trim(n)) not between 1 and 120 then raise exception 'Nombre de sucursal inválido'; end if;
  update nival_pr.branches set name=coalesce(nullif(trim(n),''),name),active=a where id=br;
  if not a then update nival_pr.memberships set active=false where branch_id=br and role='staff';
   delete from nival_pr_private.staff_sessions where business_id=b and user_id in(select user_id from nival_pr.memberships where branch_id=br); end if;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
  values(nival_pr.uid(),'branch.changed','branches',found_id,b,jsonb_build_object('name',n,'active',a));
 return found_id;
end $$;
revoke all on function nival_pr_private.manage_branch(uuid,uuid,text,boolean) from public;
grant execute on function nival_pr_private.manage_branch(uuid,uuid,text,boolean) to npr_v2_auth;

create or replace function nival_pr_private.manage_staff_branch(b uuid,br uuid,u uuid,n text,pin text,a boolean)
returns uuid language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_owner(b);
 if not exists(select 1 from nival_pr.branches where id=br and business_id=b and active) then raise exception 'Elige una sucursal activa'; end if;
 if u is null then
  if length(trim(n)) not between 1 and 100 or pin !~ '^scrypt[$][a-f0-9]{32}[$][a-f0-9]{128}$' then raise exception 'Invalid staff'; end if;
  u=gen_random_uuid();insert into nival_pr.profiles(id,role,full_name) values(u,'staff',trim(n));
  insert into nival_pr.memberships(user_id,business_id,role,pin_hash,active,branch_id) values(u,b,'staff',pin,true,br);
 else
  update nival_pr.memberships set active=a,branch_id=br where business_id=b and user_id=u and role='staff';
  if not found then raise exception 'Staff not found'; end if;
  delete from nival_pr_private.staff_sessions where user_id=u and business_id=b;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
  values(nival_pr.uid(),'staff.changed','profiles',u,b,jsonb_build_object('branch_id',br,'active',a));
 return u;
end $$;
revoke all on function nival_pr_private.manage_staff_branch(uuid,uuid,uuid,text,text,boolean) from public;
grant execute on function nival_pr_private.manage_staff_branch(uuid,uuid,uuid,text,text,boolean) to npr_v2_auth;

create or replace function nival_pr_private.manage_staff(b uuid,u uuid,n text,pin text,a boolean)
returns uuid language plpgsql security definer set search_path='' as $$ declare br uuid; begin
 perform nival_pr_private.assert_owner(b);
 select id into br from nival_pr.branches where business_id=b and is_primary and active;
 if br is null then raise exception 'Sucursal principal no disponible'; end if;
 return nival_pr_private.manage_staff_branch(b,br,u,n,pin,a);
end $$;
revoke all on function nival_pr_private.manage_staff(uuid,uuid,text,text,boolean) from public;
grant execute on function nival_pr_private.manage_staff(uuid,uuid,text,text,boolean) to npr_v2_auth;
commit;
