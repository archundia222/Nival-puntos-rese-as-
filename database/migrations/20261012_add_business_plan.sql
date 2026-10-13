-- Apply once to the isolated Nival Puntos + Reseñas database.
-- Existing businesses receive the default plan, puntos.
begin;

alter table public.npr_businesses
  add column plan text not null default 'puntos'
  check (plan in ('puntos', 'esencial', 'plus'));

commit;
