-- Owner-managed, reusable QR review cards. Existing short links and customer data stay intact.
begin;
create table if not exists nival_pr.review_cards(
 code text primary key references nival_pr.short_links(code) on delete cascade,
 business_id uuid not null references nival_pr.businesses(id) on delete cascade,
 label text not null check(length(trim(label)) between 1 and 80),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create index if not exists review_cards_business on nival_pr.review_cards(business_id,active,created_at);
alter table nival_pr.review_cards enable row level security;
revoke all on nival_pr.review_cards from public;
grant select on nival_pr.review_cards to npr_v2_owner;
create policy review_cards_owner_read on nival_pr.review_cards for select to npr_v2_owner using(nival_pr.has_business(business_id));
grant select,insert,update,delete on nival_pr.review_cards to npr_v2_admin;
create policy review_cards_admin_all on nival_pr.review_cards to npr_v2_admin using(true) with check(true);

create or replace function nival_pr_private.list_review_cards(b uuid)
returns table(code text,label text,active boolean,created_at timestamptz)
language plpgsql security definer set search_path='' as $$ begin
 perform nival_pr_private.assert_owner(b);
 return query select c.code,c.label,c.active,c.created_at from nival_pr.review_cards c
  where c.business_id=b order by c.created_at,c.code;
end $$;
revoke all on function nival_pr_private.list_review_cards(uuid) from public;
grant execute on function nival_pr_private.list_review_cards(uuid) to npr_v2_auth;

create or replace function nival_pr_private.manage_review_card(b uuid,c text,l text,a boolean)
returns text language plpgsql security definer set search_path='' as $$
declare chosen text; target text; active_count integer;
begin
 perform nival_pr_private.assert_owner(b);
 perform 1 from nival_pr.businesses where id=b for update;
 if c is null then
  if length(trim(l)) not between 1 and 80 then raise exception 'Nombre de tarjeta inválido'; end if;
  select google_maps_url into target from nival_pr.businesses where id=b;
  if target is null or target !~ '^https://' then raise exception 'Configura primero el enlace de Google'; end if;
  select count(*) into active_count from nival_pr.review_cards where business_id=b and active;
  if active_count>=10 then raise exception 'Máximo 10 tarjetas QR activas'; end if;
  chosen=substr(replace(gen_random_uuid()::text,'-',''),1,18);
  insert into nival_pr.short_links(code,target_url,business_id) values(chosen,target,b);
  insert into nival_pr.review_cards(code,business_id,label,active) values(chosen,b,trim(l),true);
 else
  if not exists(select 1 from nival_pr.review_cards where code=c and business_id=b) then raise exception 'Tarjeta no encontrada'; end if;
  if a then
   select count(*) into active_count from nival_pr.review_cards where business_id=b and active and code<>c;
   if active_count>=10 then raise exception 'Máximo 10 tarjetas QR activas'; end if;
  end if;
  update nival_pr.review_cards set active=a,label=case when nullif(trim(l),'') is null then label else trim(l) end
   where code=c and business_id=b;
  chosen=c;
 end if;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
  values(nival_pr.uid(),'review_card.changed','review_cards',null,b,jsonb_build_object('code',chosen,'active',a,'label',l));
 return chosen;
end $$;
revoke all on function nival_pr_private.manage_review_card(uuid,text,text,boolean) from public;
grant execute on function nival_pr_private.manage_review_card(uuid,text,text,boolean) to npr_v2_auth;
commit;
