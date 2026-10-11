-- Add optional birthday collection without changing existing registrations.
begin;
alter table nival_pr.customers add column if not exists birth_date date;
grant select(birth_date) on nival_pr.customers to npr_v2_owner;

create or replace function nival_pr_private.enroll_customer_with_birthday(
  sl text,n text,ph text,h text,marketing boolean,birthdate date
) returns uuid language plpgsql security definer set search_path='' as $$
declare c uuid;
begin
 if birthdate is not null and (birthdate<date '1900-01-01' or birthdate>current_date) then
  raise exception 'Invalid birthday';
 end if;
 c:=nival_pr_private.enroll_customer_legal(sl,n,ph,h,marketing);
 if birthdate is not null then
  update nival_pr.customers set birth_date=birthdate where id=c;
 end if;
 return c;
end $$;
revoke all on function nival_pr_private.enroll_customer_with_birthday(text,text,text,text,boolean,date) from public;
grant execute on function nival_pr_private.enroll_customer_with_birthday(text,text,text,text,boolean,date) to npr_v2_auth;
commit;
