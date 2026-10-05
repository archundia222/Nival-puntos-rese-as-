-- Apply after bootstrap.sql, only in the isolated Puntos + Reseñas project.
-- This table contains deliberately public information only, never customer data.
begin;
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
revoke all on public.npr_review_links from public,anon,authenticated;
grant select(id,display_name,google_url) on public.npr_review_links to anon;
grant select,insert on public.npr_review_links to authenticated;
grant update(display_name,google_url,active) on public.npr_review_links to authenticated;
create policy review_link_public on public.npr_review_links for select to anon,authenticated using(active);
create policy review_link_owner_read on public.npr_review_links for select to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy review_link_owner_create on public.npr_review_links for insert to authenticated with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy review_link_owner_update on public.npr_review_links for update to authenticated using(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check(exists(select 1 from public.npr_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
commit;
