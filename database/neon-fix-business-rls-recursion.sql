-- Break the owner/member RLS cycle introduced by staff access.
-- Owner membership reads delegate to a narrowly scoped SECURITY DEFINER check,
-- so the policy can verify business ownership without recursively applying
-- policies on npr_businesses.
create or replace function public.npr_is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
 select exists(
  select 1
  from public.npr_businesses b
  where b.id=p_business_id
    and b.owner_id=public.npr_uid()
 )
$function$;

revoke all on function public.npr_is_business_owner(uuid) from public,npr_anon,npr_card_reader;
grant execute on function public.npr_is_business_owner(uuid) to npr_app;

alter policy member_owner_read on public.npr_business_members
 to npr_app
 using(public.npr_is_business_owner(business_id));
