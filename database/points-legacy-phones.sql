-- Incremental compatibility with the ten-digit phones registered in phase 1.
begin;
-- Preserve IDs, balances and conflicting rows; never merge customer identities.
update nival_pr.customers c set phone='52'||c.phone where length(c.phone)=10 and not exists(select 1 from nival_pr.customers c2 where c2.business_id=c.business_id and c2.phone='52'||c.phone);
create or replace function nival_pr_private.staff_customer(b uuid,ph text,c uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare target nival_pr.customers; r uuid; begin
 perform nival_pr_private.assert_staff_or_owner(b);
 if c is null and (select count(*) from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph)))>1 then raise exception 'Telefono ambiguo usa QR';end if;
 select * into target from nival_pr.customers where business_id=b and ((c is not null and id=c) or (c is null and (phone=ph or (length(phone)=10 and '52'||phone=ph))));
 if not found then return null;end if;
 r=nival_pr_private.next_reward(target.id);
 return jsonb_build_object('id',target.id,'name',target.name,'phone',case when length(target.phone)=10 then '52'||target.phone else target.phone end,'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=target.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=r));end $$;
create or replace function nival_pr_private.enroll_customer(sl text,n text,ph text,h text) returns uuid language plpgsql security definer set search_path='' as $$ declare b uuid;c uuid;begin
 if h !~ '^[a-f0-9]{64}$' or length(trim(n)) not between 1 and 100 or ph !~ '^52[0-9]{10}$' then raise exception 'Invalid registration';end if;
 select id into b from nival_pr.businesses where slug=sl and status='activo' and (paid_until>now() or trial_ends_at>now());if b is null then raise exception 'Inactive business';end if;
 if exists(select 1 from nival_pr.customers where business_id=b and (phone=ph or (length(phone)=10 and '52'||phone=ph))) then raise exception 'duplicate phone';end if;
 insert into nival_pr.customers(business_id,name,phone,device_token_hash,token_expires_at,consent_at,consent_version) values(b,trim(n),ph,h,now()+interval '1 year',now(),'2026-10-05') returning id into c;return c;end $$;
commit;
