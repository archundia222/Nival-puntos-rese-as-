-- Additive employee access migration for the isolated Puntos + Reseñas database.
-- This migration preserves membership history by deactivating, not deleting, staff.
begin;

create table public.npr_business_members (
 business_id uuid not null references public.npr_businesses(id) on delete cascade,
 user_id uuid not null references neon_auth."user"(id) on delete cascade,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key (business_id,user_id)
);
create unique index if not exists npr_active_staff_one_business on public.npr_business_members(user_id) where active;
alter table public.npr_business_members enable row level security;
revoke all on public.npr_business_members from public,npr_anon,npr_app;
create policy member_self_read on public.npr_business_members for select to npr_app
 using(user_id=(select public.npr_uid()) and active);
create policy member_owner_read on public.npr_business_members for select to npr_app
 using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
grant select on public.npr_business_members to npr_app;

create policy business_member_read on public.npr_businesses for select to npr_app
 using(exists(select 1 from public.npr_business_members m where m.business_id=id and m.user_id=(select public.npr_uid()) and m.active));
create policy customer_member_create on public.npr_customers for insert to npr_app
 with check(exists(select 1 from public.npr_business_members m where m.business_id=npr_customers.business_id and m.user_id=(select public.npr_uid()) and m.active));
create policy movement_member_create on public.npr_movements for insert to npr_app
 with check(exists(select 1 from public.npr_business_members m where m.business_id=npr_movements.business_id and m.user_id=(select public.npr_uid()) and m.active));

-- Staff can operate loyalty, while reviews and diagnostics remain owner/operator data.
create policy review_owner_only_read on public.npr_reviews as restrictive for select to npr_app
 using(exists(select 1 from public.npr_businesses b where b.id=business_id and (b.owner_id=(select public.npr_uid()) or (select public.npr_is_operator()))));
create policy diagnostic_owner_only_read on public.npr_diagnostics as restrictive for select to npr_app
 using(exists(select 1 from public.npr_businesses b where b.id=business_id and (b.owner_id=(select public.npr_uid()) or (select public.npr_is_operator()))));

create function public.npr_list_staff()
 returns table(user_id uuid,email text,created_at timestamptz,active boolean)
 language plpgsql security definer set search_path=''
as $$
declare business uuid;
begin
 select b.id into business from public.npr_businesses b where b.owner_id=public.npr_uid();
 if business is null then raise exception 'Owner access required'; end if;
 return query select m.user_id,u.email,m.created_at,m.active
  from public.npr_business_members m join neon_auth."user" u on u.id=m.user_id
  where m.business_id=business order by m.active desc,m.created_at;
end; $$;

create function public.npr_assign_staff(p_email text)
 returns table(user_id uuid,email text,created_at timestamptz,active boolean)
 language plpgsql security definer set search_path=''
as $$
declare business uuid; member uuid;
begin
 select b.id into business from public.npr_businesses b where b.owner_id=public.npr_uid();
 if business is null then raise exception 'Owner access required'; end if;
 select u.id into member from neon_auth."user" u
  where lower(u.email)=lower(trim(p_email)) and u."emailVerified"=true;
 if member is null then raise exception 'Verified account not found'; end if;
 if member=public.npr_uid() then raise exception 'Owner cannot be assigned as staff'; end if;
 insert into public.npr_business_members(business_id,user_id,active) values(business,member,true)
  on conflict(business_id,user_id) do update set active=true;
 return query select m.user_id,u.email,m.created_at,m.active
  from public.npr_business_members m join neon_auth."user" u on u.id=m.user_id
  where m.business_id=business and m.user_id=member;
end; $$;

create function public.npr_revoke_staff(p_user_id uuid)
 returns boolean language plpgsql security definer set search_path=''
as $$
declare business uuid; changed integer;
begin
 select b.id into business from public.npr_businesses b where b.owner_id=public.npr_uid();
 if business is null then raise exception 'Owner access required'; end if;
 update public.npr_business_members set active=false
  where business_id=business and user_id=p_user_id and active;
 get diagnostics changed=row_count;
 return changed=1;
end; $$;

revoke all on function public.npr_list_staff() from public,npr_anon;
revoke all on function public.npr_assign_staff(text) from public,npr_anon;
revoke all on function public.npr_revoke_staff(uuid) from public,npr_anon;
grant execute on function public.npr_list_staff() to npr_app;
grant execute on function public.npr_assign_staff(text) to npr_app;
grant execute on function public.npr_revoke_staff(uuid) to npr_app;
commit;
