-- Apply after bootstrap.sql, only in the isolated Puntos + Reseñas database.
begin;
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
revoke all on public.npr_diagnostics from public,anon,authenticated;
create policy diagnostic_read on public.npr_diagnostics for select to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id));
create policy diagnostic_create on public.npr_diagnostics for insert to authenticated with check((select public.npr_is_operator()));
grant select,insert on public.npr_diagnostics to authenticated;
commit;
