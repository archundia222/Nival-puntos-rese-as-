begin;
create table if not exists nival_pr.reviews (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references nival_pr.businesses(id),
 reviewer text not null check(length(reviewer) between 1 and 120), stars int not null check(stars between 1 and 5),
 body text not null default '' check(length(body)<=10000), reviewed_on date not null,
 fingerprint text not null, response_draft text, published_response text, published_at timestamptz,
 created_at timestamptz not null default now(), unique(business_id,fingerprint),
 check((published_at is null)=(published_response is null))
);
create table if not exists nival_pr.generated_reports (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references nival_pr.businesses(id),
 kind text not null check(kind in ('diagnosis','week','month')),period_start date not null,period_end date not null,
 rating numeric(2,1) check(rating between 1 and 5),total_reviews int check(total_reviews>=0),
 analysis jsonb not null, status text not null default 'draft' check(status in ('draft','approved')),
 created_by uuid not null references nival_pr.profiles(id),created_at timestamptz not null default now(),
 approved_at timestamptz,sent_at timestamptz,check(period_end>period_start),
 check((status='approved')=(approved_at is not null))
);
alter table nival_pr.reviews enable row level security;
alter table nival_pr.generated_reports enable row level security;
revoke all on nival_pr.reviews,nival_pr.generated_reports from public;
grant select,insert,update on nival_pr.reviews,nival_pr.generated_reports to npr_v2_admin;
grant select on nival_pr.reviews,nival_pr.generated_reports to npr_v2_owner;
create policy reputation_admin on nival_pr.reviews to npr_v2_admin using(true) with check(true);
create policy reputation_owner on nival_pr.reviews to npr_v2_owner using(nival_pr.has_business(business_id));
create policy reports_admin on nival_pr.generated_reports to npr_v2_admin using(true) with check(true);
create policy reports_owner on nival_pr.generated_reports to npr_v2_owner using(status='approved' and nival_pr.has_business(business_id));
create index reviews_business_date on nival_pr.reviews(business_id,reviewed_on);
create index reports_business_period on nival_pr.generated_reports(business_id,period_start);
alter table nival_pr.businesses add column if not exists service_started_at timestamptz;
update nival_pr.businesses set service_started_at=paid_until-interval '30 days' where paid_until is not null and service_started_at is null;
-- Keep existing plan IDs and historical payments. Update the initial offer and add the second tier.
update nival_pr.plans set name='Nival Esencial',price_mxn=399,features=features||'{"review_limit":30}'::jsonb where interval='month' and price_mxn=399;
insert into nival_pr.plans(name,price_mxn,interval,features) select 'Nival Plus',499,'month','{"review_limit":100}'::jsonb where not exists(select 1 from nival_pr.plans where interval='month' and price_mxn=499);
update nival_pr.plans set features=features||'{"review_limit":100}'::jsonb where interval='month' and price_mxn=499;
alter table nival_pr.activation_codes add column if not exists payment_id uuid unique references nival_pr.payments(id);
create function nival_pr_private.set_initial_plan(b uuid,price integer) returns void language plpgsql security definer set search_path='' as $$ declare p uuid;begin
 if price not in (399,499) then raise exception 'Plan inválido';end if;
 if not exists(select 1 from nival_pr.memberships where business_id=b and user_id=nival_pr.uid() and role='owner' and active) then raise exception 'Owner required';end if;
 select id into p from nival_pr.plans where interval='month' and price_mxn=price order by name limit 1;
 if p is null then raise exception 'Plan no disponible';end if;
 update nival_pr.businesses set plan_id=p where id=b and status in ('registrado','cotizando') and paid_until is null;
 if not found then raise exception 'Consulta a Nival para cambiar un servicio contratado';end if;
end $$;
revoke all on function nival_pr_private.set_initial_plan(uuid,integer) from public;
grant execute on function nival_pr_private.set_initial_plan(uuid,integer) to npr_v2_auth;
create function nival_pr_private.register_business_plan_complete(sl text,n text,g text,o text,ph text,e text,m text,accepted boolean,v text,price integer) returns uuid language plpgsql security definer set search_path='' as $$ declare b uuid;begin
 b=nival_pr_private.register_business_complete(sl,n,g,o,ph,e,m,accepted,v);
 perform nival_pr_private.set_initial_plan(b,price);return b;
end $$;
revoke all on function nival_pr_private.register_business_plan_complete(text,text,text,text,text,text,text,boolean,text,integer) from public;
grant execute on function nival_pr_private.register_business_plan_complete(text,text,text,text,text,text,text,boolean,text,integer) to npr_v2_auth;
create function nival_pr.publish_review(r uuid,reply text) returns void language plpgsql security invoker set search_path='' as $$
declare b nival_pr.businesses;limit_n int;used int;start_at timestamptz;
begin
 if length(trim(reply)) not between 1 and 10000 then raise exception 'Respuesta inválida';end if;
 select bs.* into b from nival_pr.businesses bs join nival_pr.reviews rv on rv.business_id=bs.id where rv.id=r for update of bs;
 if b.id is null then raise exception 'Reseña no encontrada';end if;
 if b.status<>'activo' or b.paid_until<=now() or b.paid_until is null then raise exception 'Servicio no activo';end if;
 if exists(select 1 from nival_pr.reviews where id=r and published_at is not null) then raise exception 'Reseña ya respondida';end if;
 select (features->>'review_limit')::int into limit_n from nival_pr.plans where id=b.plan_id;
 if limit_n is null then raise exception 'Plan sin cupo configurado';end if;
 start_at=coalesce(b.service_started_at,b.paid_until-interval '30 days');
 start_at=start_at+floor(extract(epoch from now()-start_at)/2592000)::int*interval '30 days';
 select count(*) into used from nival_pr.reviews where business_id=b.id and published_at>=start_at and published_at<start_at+interval '30 days';
 if used>=limit_n then raise exception 'Cupo agotado. Las respuestas adicionales quedan pendientes.';end if;
 update nival_pr.reviews set published_at=now(),published_response=trim(reply),response_draft=trim(reply) where id=r;
 insert into nival_pr.audit_log(actor_id,action,entity,business_id,entity_id) values(nival_pr.uid(),'review.published','reviews',b.id,r);
end $$;
revoke all on function nival_pr.publish_review(uuid,text) from public;
grant execute on function nival_pr.publish_review(uuid,text) to npr_v2_admin;
commit;
