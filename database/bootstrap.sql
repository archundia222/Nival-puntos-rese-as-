-- Apply only to the isolated Puntos + Reseñas test project after review.
-- Do not run in Nival Pay, Nival Tech or Nival Links databases.
begin;
create table public.npr_operators (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.npr_operators enable row level security;
revoke all on public.npr_operators from authenticated;
create policy operators_self on public.npr_operators for select to authenticated using(user_id=(select auth.uid()));
grant select on public.npr_operators to authenticated;
revoke all on public.npr_operators from anon;
create function public.npr_is_operator() returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.npr_operators where user_id=(select auth.uid()));
$$;
revoke all on function public.npr_is_operator() from public,anon;
grant execute on function public.npr_is_operator() to authenticated;
create table public.npr_businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 150),
 reward_goal integer not null default 5 check(reward_goal between 1 and 100000),
 reward_name text not null default 'Premio por definir' check(length(trim(reward_name)) between 1 and 150),
 risk_days integer not null default 30 check(risk_days between 1 and 365),
 created_at timestamptz not null default now()
);
alter table public.npr_businesses enable row level security;
revoke all on public.npr_businesses from authenticated;
create policy business_read on public.npr_businesses for select to authenticated using(owner_id=(select auth.uid()) or (select public.npr_is_operator()));
create policy business_create on public.npr_businesses for insert to authenticated with check(owner_id=(select auth.uid()));
create policy business_update on public.npr_businesses for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
grant select,insert on public.npr_businesses to authenticated;
grant update(name,reward_goal,reward_name,risk_days) on public.npr_businesses to authenticated;
revoke all on public.npr_businesses from anon;
create table public.npr_customers (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.npr_businesses(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100),
 phone text check(phone is null or phone ~ '^[0-9]{7,15}$'),
 created_at timestamptz not null default now(),
 unique(id,business_id)
);
create unique index customer_phone_unique on public.npr_customers(business_id,phone) where phone is not null;
create index customer_business on public.npr_customers(business_id);
alter table public.npr_customers enable row level security;
revoke all on public.npr_customers from authenticated;
create policy customer_read on public.npr_customers for select to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy customer_create on public.npr_customers for insert to authenticated with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy customer_update on public.npr_customers for update to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
grant select,insert on public.npr_customers to authenticated;
grant update(name,phone) on public.npr_customers to authenticated;
revoke all on public.npr_customers from anon;
create table public.npr_movements (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.npr_businesses(id) on delete cascade,
 customer_id uuid not null,
 kind text not null check(kind in ('visit','redeem')),
 points integer not null check((kind='visit' and points=1) or (kind='redeem' and points<0)),
 happened_at timestamptz not null default now(),
 foreign key(customer_id,business_id) references public.npr_customers(id,business_id) on delete cascade
);
create index movement_customer_date on public.npr_movements(customer_id,happened_at);
create index movement_business_date on public.npr_movements(business_id,happened_at);
alter table public.npr_movements enable row level security;
revoke all on public.npr_movements from authenticated;
create policy movement_read on public.npr_movements for select to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy movement_create on public.npr_movements for insert to authenticated with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
grant select,insert on public.npr_movements to authenticated;
revoke all on public.npr_movements from anon;
create function public.npr_check_movement() returns trigger language plpgsql security invoker set search_path='' as $$
declare balance bigint; goal integer;
begin
 perform 1 from public.npr_customers where id=new.customer_id and business_id=new.business_id for update;
 if not found then raise exception 'Customer not accessible'; end if;
 select reward_goal into goal from public.npr_businesses where id=new.business_id;
 select coalesce(sum(points),0) into balance from public.npr_movements where customer_id=new.customer_id;
 if new.kind='redeem' and new.points <> -goal then raise exception 'Invalid reward amount'; end if;
 if balance+new.points<0 then raise exception 'Insufficient points'; end if;
 new.happened_at=now();
 return new;
end;
$$;
revoke all on function public.npr_check_movement() from public,anon;
create trigger npr_movement_guard before insert on public.npr_movements for each row execute function public.npr_check_movement();
create table public.npr_reviews (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.npr_businesses(id) on delete cascade,
 author text not null check(length(trim(author)) between 1 and 100),
 rating integer not null check(rating between 1 and 5),
 body text not null default '' check(length(body)<=5000),
 review_date date not null,
 answered_at timestamptz,
 created_at timestamptz not null default now()
);
create unique index review_duplicate_guard on public.npr_reviews(business_id,author,review_date,rating,md5(body));
create index review_business_date on public.npr_reviews(business_id,review_date);
alter table public.npr_reviews enable row level security;
revoke all on public.npr_reviews from authenticated;
create policy review_read on public.npr_reviews for select to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy review_create on public.npr_reviews for insert to authenticated with check((select public.npr_is_operator()));
create policy review_update on public.npr_reviews for update to authenticated using((select public.npr_is_operator())) with check((select public.npr_is_operator()));
grant select,insert,update on public.npr_reviews to authenticated;
revoke all on public.npr_reviews from anon;
commit;
