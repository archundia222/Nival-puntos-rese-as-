begin;

alter table nival_pr.programs add column if not exists card_enabled boolean not null default true;
grant select(card_enabled) on nival_pr.programs to npr_v2_auth;
grant update(card_enabled) on nival_pr.programs to npr_v2_owner;

create or replace function nival_pr_private.public_business(sl text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'active',b.status='activo' and (b.paid_until>now() or b.trial_ends_at>now()),'google_maps_url',b.google_maps_url,'program',jsonb_build_object('id',p.id,'name',p.name,'color',p.color,'logo_url',p.logo_url,'mode',p.mode,'card_enabled',p.card_enabled,'points_per_visit',p.points_per_visit,'rules',p.rules),'rewards',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'points_cost',r.points_cost) order by r.position,r.id) from nival_pr.rewards r where r.program_id=p.id and r.active),'[]'::jsonb)) from nival_pr.businesses b left join nival_pr.programs p on p.business_id=b.id where b.slug=sl
$$;
revoke all on function nival_pr_private.public_business(text) from public;
grant execute on function nival_pr_private.public_business(text) to npr_v2_auth;

create or replace function nival_pr_private.enroll_customer_legal(sl text,n text,ph text,h text,marketing boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare b uuid;c uuid;
begin
 if h !~ '^[a-f0-9]{64}$' or length(trim(n)) not between 1 and 100 or ph !~ '^52[0-9]{10}$' then raise exception 'Invalid registration';end if;
 select bs.id into b from nival_pr.businesses bs join nival_pr.programs p on p.business_id=bs.id where bs.slug=sl and bs.status='activo' and (bs.paid_until>now() or bs.trial_ends_at>now()) and p.card_enabled;
 if b is null then raise exception 'Inactive business or card';end if;
 select id into c from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph)) for update;
 if c is not null then update nival_pr.customers set device_token_hash=h,token_expires_at=now()+interval '1 year' where id=c;return c;end if;
 if not exists(select 1 from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=b and r.active) then raise exception 'Program not ready';end if;
 c:=nival_pr_private.enroll_customer(sl,n,ph,h);
 update nival_pr.customers set consent_version='piloto-v2-2026-10-05',marketing_consent=coalesce(marketing,false),marketing_consent_at=case when marketing then now() else null end where id=c;
 return c;
exception when unique_violation then
 select bs.id into b from nival_pr.businesses bs where bs.slug=sl;
 select id into c from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph)) for update;
 if c is null then raise;end if;
 update nival_pr.customers set device_token_hash=h,token_expires_at=now()+interval '1 year' where id=c;
 return c;
end $$;
revoke all on function nival_pr_private.enroll_customer_legal(text,text,text,text,boolean) from public;
grant execute on function nival_pr_private.enroll_customer_legal(text,text,text,text,boolean) to npr_v2_auth;

create or replace function nival_pr_private.recover_customer_by_phone(sl text,ph text,h text) returns uuid language plpgsql security definer set search_path='' as $$
declare b uuid;c uuid;
begin
 if ph !~ '^52[0-9]{10}$' or h !~ '^[a-f0-9]{64}$' then raise exception 'Invalid recovery';end if;
 select id into b from nival_pr.businesses where slug=sl;
 if b is null then return null;end if;
 select id into c from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph)) for update;
 if c is null then return null;end if;
 update nival_pr.customers set device_token_hash=h,token_expires_at=now()+interval '1 year' where id=c;
 return c;
end $$;
revoke all on function nival_pr_private.recover_customer_by_phone(text,text,text) from public;
grant execute on function nival_pr_private.recover_customer_by_phone(text,text,text) to npr_v2_auth;

create or replace function nival_pr_private.card_active_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.type in ('visit','redeem') and not exists(select 1 from nival_pr.programs p where p.business_id=new.business_id and p.card_enabled) then raise exception 'Tarjeta inactiva';end if;
 return new;
end $$;
revoke all on function nival_pr_private.card_active_guard() from public;
create trigger card_active_guard before insert on nival_pr.point_ledger for each row execute function nival_pr_private.card_active_guard();

commit;
