begin;
alter table nival_pr.customers add column if not exists marketing_consent boolean not null default false;
alter table nival_pr.customers add column if not exists marketing_consent_at timestamptz;
grant select(marketing_consent,marketing_consent_at) on nival_pr.customers to npr_v2_owner;
create or replace function nival_pr_private.enroll_customer_legal(sl text,n text,ph text,h text,marketing boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare c uuid;
begin
 c:=nival_pr_private.enroll_customer(sl,n,ph,h);
 update nival_pr.customers set consent_version='piloto-v2-2026-10-05',marketing_consent=coalesce(marketing,false),marketing_consent_at=case when marketing then now() else null end where id=c;
 return c;
end $$;
create or replace function nival_pr_private.consent_customer_legal(b uuid,h text,marketing boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform nival_pr_private.consent_customer(b,h);
 update nival_pr.customers set consent_version='piloto-v2-2026-10-05',marketing_consent=coalesce(marketing,false),marketing_consent_at=case when marketing then now() else null end where business_id=b and device_token_hash=h and token_expires_at>now();
end $$;
revoke all on function nival_pr_private.enroll_customer_legal(text,text,text,text,boolean),nival_pr_private.consent_customer_legal(uuid,text,boolean) from public;
grant execute on function nival_pr_private.enroll_customer_legal(text,text,text,text,boolean),nival_pr_private.consent_customer_legal(uuid,text,boolean) to npr_v2_auth;
commit;
