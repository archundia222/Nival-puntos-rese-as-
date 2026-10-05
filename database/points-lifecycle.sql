-- Incremental lifecycle fix after points-v3. Keep existing tokens while renewing owner recovery.
begin;
create or replace function nival_pr_private.rotate_customer_token(b uuid,c uuid,h text) returns void language plpgsql security definer set search_path='' as $$ begin
 if h is not null and h !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token';end if;
 if not exists(select 1 from nival_pr.profiles where id=nival_pr.uid() and role='superadmin') and not exists(select 1 from nival_pr.memberships where user_id=nival_pr.uid() and business_id=b and role='owner' and active) then raise exception 'Owner required';end if;
 update nival_pr.customers set device_token_hash=h,token_expires_at=case when h is null then null else now()+interval '1 year' end where id=c and business_id=b;
 if not found then raise exception 'Customer not found';end if;end $$;
commit;
