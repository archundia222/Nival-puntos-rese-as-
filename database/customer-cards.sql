-- Apply only after bootstrap.sql in the independent Puntos + Reseñas project.
begin;
alter table public.npr_customers
 add column card_token uuid not null default gen_random_uuid() unique,
 add column card_enabled boolean not null default false;
-- Existing ownership policies protect these updates. Anonymous users still
-- have no table access: the server checks a non-sequential capability token.
grant update(card_token,card_enabled) on public.npr_customers to authenticated;
grant select(id,business_id,card_token,card_enabled) on public.npr_customers to service_role;
grant select(name,reward_goal,reward_name,id) on public.npr_businesses to service_role;
grant select(customer_id,business_id,points,id,happened_at) on public.npr_movements to service_role;
commit;
