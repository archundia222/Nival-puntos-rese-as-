-- Isolated Neon backend only. Never apply to existing applications.
begin;
create role npr_app nologin;
create role npr_anon nologin;
create role npr_card_reader nologin;
do $$ begin execute format('grant npr_app,npr_anon,npr_card_reader to %I',current_user); end $$;
grant usage on schema public to npr_app,npr_anon,npr_card_reader;
create function public.npr_uid() returns uuid language sql stable security invoker set search_path='' as $$select nullif(current_setting('npr.user_id',true),'')::uuid$$;
revoke all on function public.npr_uid() from public;
grant execute on function public.npr_uid() to npr_app;
-- Apply only to the isolated Puntos + Reseñas test project after review.
-- Do not run in Nival Pay, Nival Tech or Nival Links databases.

create table public.npr_operators (
 user_id uuid primary key references neon_auth."user"(id) on delete cascade
);
alter table public.npr_operators enable row level security;
revoke all on public.npr_operators from npr_app;
create policy operators_self on public.npr_operators for select to npr_app using(user_id=(select public.npr_uid()));
grant select on public.npr_operators to npr_app;
revoke all on public.npr_operators from npr_anon;
create function public.npr_is_operator() returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.npr_operators where user_id=(select public.npr_uid()));
$$;
revoke all on function public.npr_is_operator() from public,npr_anon;
grant execute on function public.npr_is_operator() to npr_app;
create table public.npr_businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references neon_auth."user"(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 150),
 reward_goal integer not null default 5 check(reward_goal between 1 and 100000),
 reward_name text not null default 'Premio por definir' check(length(trim(reward_name)) between 1 and 150),
 risk_days integer not null default 30 check(risk_days between 1 and 365),
 created_at timestamptz not null default now()
);
alter table public.npr_businesses enable row level security;
revoke all on public.npr_businesses from npr_app;
create policy business_read on public.npr_businesses for select to npr_app using(owner_id=(select public.npr_uid()) or (select public.npr_is_operator()));
create policy business_create on public.npr_businesses for insert to npr_app with check(owner_id=(select public.npr_uid()));
create policy business_update on public.npr_businesses for update to npr_app using(owner_id=(select public.npr_uid())) with check(owner_id=(select public.npr_uid()));
grant select,insert on public.npr_businesses to npr_app;
grant update(name,reward_goal,reward_name,risk_days) on public.npr_businesses to npr_app;
revoke all on public.npr_businesses from npr_anon;
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
revoke all on public.npr_customers from npr_app;
create policy customer_read on public.npr_customers for select to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy customer_create on public.npr_customers for insert to npr_app with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
create policy customer_update on public.npr_customers for update to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid()))) with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
grant select,insert on public.npr_customers to npr_app;
grant update(name,phone) on public.npr_customers to npr_app;
revoke all on public.npr_customers from npr_anon;
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
revoke all on public.npr_movements from npr_app;
create policy movement_read on public.npr_movements for select to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy movement_create on public.npr_movements for insert to npr_app with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
grant select,insert on public.npr_movements to npr_app;
revoke all on public.npr_movements from npr_anon;
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
revoke all on function public.npr_check_movement() from public,npr_anon;
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
revoke all on public.npr_reviews from npr_app;
create policy review_read on public.npr_reviews for select to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy review_create on public.npr_reviews for insert to npr_app with check((select public.npr_is_operator()));
create policy review_update on public.npr_reviews for update to npr_app using((select public.npr_is_operator())) with check((select public.npr_is_operator()));
grant select,insert,update on public.npr_reviews to npr_app;
revoke all on public.npr_reviews from npr_anon;


-- Apply after bootstrap.sql, only in the isolated Puntos + Reseñas database.

create table public.npr_diagnostics (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.npr_businesses(id) on delete cascade,
 checked_on date not null,
 rating numeric(2,1) not null check(rating between 1 and 5),
 review_count integer not null check(review_count>=0),
 findings text not null check(length(trim(findings)) between 1 and 5000),
 recommendations text not null check(length(trim(recommendations)) between 1 and 5000),
 created_at timestamptz not null default now(),
 unique(business_id,checked_on)
);
create index diagnostic_business_date on public.npr_diagnostics(business_id,checked_on desc);
alter table public.npr_diagnostics enable row level security;
revoke all on public.npr_diagnostics from public,npr_anon,npr_app;
create policy diagnostic_read on public.npr_diagnostics for select to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy diagnostic_create on public.npr_diagnostics for insert to npr_app with check((select public.npr_is_operator()));
grant select,insert on public.npr_diagnostics to npr_app;


-- Apply after bootstrap.sql, only in the isolated Puntos + Reseñas project.
-- This table contains deliberately public information only, never customer data.

create table public.npr_review_links (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null unique references public.npr_businesses(id) on delete cascade,
 display_name text not null check(length(trim(display_name)) between 1 and 150),
 google_url text not null check(length(google_url)<=2000 and (
   google_url ~ '^https://g[.]page/r/[A-Za-z0-9_-]+/review$' or
   google_url ~ '^https://maps[.]app[.]goo[.]gl/[A-Za-z0-9_-]+$' or
   google_url ~ '^https://search[.]google[.]com/local/writereview[?]placeid=[A-Za-z0-9_-]+$'
 )),
 active boolean not null default true
);
alter table public.npr_review_links enable row level security;
revoke all on public.npr_review_links from public,npr_anon,npr_app;
grant select(id,display_name,google_url) on public.npr_review_links to npr_anon;
grant select,insert on public.npr_review_links to npr_app;
grant update(display_name,google_url,active) on public.npr_review_links to npr_app;
create policy review_link_public on public.npr_review_links for select to npr_anon,npr_app using(active);
create policy review_link_owner_read on public.npr_review_links for select to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
create policy review_link_owner_create on public.npr_review_links for insert to npr_app with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
create policy review_link_owner_update on public.npr_review_links for update to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid()))) with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));


-- Apply only after bootstrap.sql in the independent Puntos + Reseñas project.

alter table public.npr_customers
 add column card_token uuid not null default gen_random_uuid() unique,
 add column card_enabled boolean not null default false;
-- Existing ownership policies protect these updates. Anonymous users still
-- have no table access: the server checks a non-sequential capability token.
grant update(card_token,card_enabled) on public.npr_customers to npr_app;
grant select(id,business_id,card_token,card_enabled) on public.npr_customers to npr_card_reader;
grant select(name,reward_goal,reward_name,id) on public.npr_businesses to npr_card_reader;
grant select(customer_id,business_id,points,id,happened_at) on public.npr_movements to npr_card_reader;


create policy card_customer_read on public.npr_customers for select to npr_card_reader using(card_enabled and card_token=nullif(current_setting('npr.card_token',true),'')::uuid);
create policy card_business_read on public.npr_businesses for select to npr_card_reader using(exists(select 1 from public.npr_customers c where c.business_id=npr_businesses.id));
create policy card_movement_read on public.npr_movements for select to npr_card_reader using(exists(select 1 from public.npr_customers c where c.id=customer_id and c.business_id=npr_movements.business_id));
commit;
