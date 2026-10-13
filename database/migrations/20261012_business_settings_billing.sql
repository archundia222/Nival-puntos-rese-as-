-- Apply once after 20261012_add_business_plan.sql in the isolated Nival Puntos + Reseñas database.
begin;

alter table public.npr_businesses
  add column category text not null default '' check(length(category)<=120),
  add column neighborhood text not null default '' check(length(neighborhood)<=120),
  add column max_visits_per_customer_per_day smallint not null default 1 check(max_visits_per_customer_per_day between 1 and 3),
  add column points_expiration_days integer check(points_expiration_days is null or points_expiration_days>0),
  add column plan_started_at date,
  add column period_end_date date,
  add column next_payment_at date,
  add column subscription_status text not null default 'active' check(subscription_status in ('active','expired'));

grant update(name,category,neighborhood,max_visits_per_customer_per_day,points_expiration_days,reward_goal,reward_name,risk_days) on public.npr_businesses to npr_app;

create table public.npr_manual_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.npr_businesses(id) on delete cascade,
  amount numeric(10,2) not null check(amount>0),
  paid_on date not null,
  created_at timestamptz not null default now()
);
create index manual_payment_business_date on public.npr_manual_payments(business_id,paid_on desc);
alter table public.npr_manual_payments enable row level security;
revoke all on public.npr_manual_payments from public,npr_anon,npr_app;
create policy manual_payment_owner_read on public.npr_manual_payments for select to npr_app using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select public.npr_uid())));
grant select on public.npr_manual_payments to npr_app;

create or replace function public.npr_check_movement() returns trigger language plpgsql security invoker set search_path='' as $$
declare balance bigint; goal integer; daily_limit integer; visits_today integer;
begin
  perform 1 from public.npr_customers where id=new.customer_id and business_id=new.business_id for update;
  if not found then raise exception 'Customer not accessible'; end if;
  select reward_goal,max_visits_per_customer_per_day into goal,daily_limit from public.npr_businesses where id=new.business_id;
  select coalesce(sum(points),0) into balance from public.npr_movements where customer_id=new.customer_id;
  if new.kind='visit' then
    select count(*) into visits_today from public.npr_movements where customer_id=new.customer_id and kind='visit' and (happened_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date;
    if visits_today>=daily_limit then raise exception using message='Daily visit limit reached',errcode='NPR01'; end if;
  end if;
  if new.kind='redeem' and new.points <> -goal then raise exception 'Invalid reward amount'; end if;
  if balance+new.points<0 then raise exception 'Insufficient points'; end if;
  new.happened_at=now();
  return new;
end;
$$;

commit;
