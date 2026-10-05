begin;
create or replace function nival_pr_private.register_business_complete(sl text,n text,g text,o text,ph text,e text,m text,accepted boolean,v text) returns uuid language plpgsql security definer set search_path='' as $$
declare b uuid;
begin
 if accepted is distinct from true or v is distinct from 'piloto-borrador-2026-10-05' then raise exception 'Legal acceptance required'; end if;
 if length(trim(n)) not between 2 and 150 or length(sl)>100 or sl !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(trim(o)) not between 2 and 150 or ph !~ '^52[0-9]{10}$' or length(e)>254 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(m)>2048 or m !~ '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|maps\.google\.com/|(www\.)?google\.com(\.mx)?/maps(/|$))' or g not in ('Cafetería / restaurante','Barbería / estética','Lavandería','Veterinaria','Gimnasio','Otro') then raise exception 'Invalid registration'; end if;
 b:=nival_pr_private.register_business(sl,n,g);
 update nival_pr.businesses set owner_name=trim(o),phone=ph,email=trim(e),google_maps_url=m where id=b;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data) values(nival_pr.uid(),'business.legal_accepted','businesses',b,b,jsonb_build_object('version',v,'terms','/terminos','privacy','/privacidad','accepted_at',now()));
 return b;
end $$;
revoke all on function nival_pr_private.register_business_complete(text,text,text,text,text,text,text,boolean,text) from public;
grant execute on function nival_pr_private.register_business_complete(text,text,text,text,text,text,text,boolean,text) to npr_v2_auth;
-- Impide omitir los campos y el consentimiento usando la función anterior.
revoke execute on function nival_pr_private.register_business(text,text,text) from npr_v2_auth;
commit;
