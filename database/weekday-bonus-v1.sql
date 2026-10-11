-- Double the actual visit points on a business-selected local weekday.
begin;
create or replace function nival_pr_private.apply_weekday_bonus() returns trigger
language plpgsql security definer set search_path='' as $$
declare p nival_pr.programs; weekday integer;
begin
 if new.type='visit' then
  select * into p from nival_pr.programs where business_id=new.business_id;
  weekday=extract(dow from (now() at time zone 'America/Mexico_City'))::integer;
  if (p.rules->>'double_points_weekday') ~ '^[0-6]$'
    and (p.rules->>'double_points_weekday')::integer=weekday then
   new.points=p.points_per_visit*2;
  end if;
 end if;
 return new;
end $$;
revoke all on function nival_pr_private.apply_weekday_bonus() from public;
drop trigger if exists aaa_weekday_bonus on nival_pr.point_ledger;
create trigger aaa_weekday_bonus before insert on nival_pr.point_ledger
 for each row execute function nival_pr_private.apply_weekday_bonus();

do $$ declare oid oid; body text; original text; replacement text;
begin
 select p.oid into oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='nival_pr_private' and p.proname='guard_movement' and p.pronargs=0;
 if oid is null then raise exception 'guard_movement no encontrado'; end if;
 body=pg_get_functiondef(oid);
 original='if new.points<>p.points_per_visit then raise exception ''Cantidad de puntos invalida''; end if;';
 replacement='if new.points<>p.points_per_visit and not (new.points=p.points_per_visit*2 and (p.rules->>''double_points_weekday'') ~ ''^[0-6]$'' and (p.rules->>''double_points_weekday'')::integer=extract(dow from (now() at time zone ''America/Mexico_City''))::integer) then raise exception ''Cantidad de puntos invalida''; end if;';
 if position(original in body)=0 then raise exception 'No se pudo extender la validación de puntos'; end if;
 execute replace(body,original,replacement);
end $$;
commit;
