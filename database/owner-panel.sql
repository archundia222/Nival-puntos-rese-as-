begin;
create table nival_pr.segment_settings(
 business_id uuid primary key references nival_pr.businesses(id),
 new_days int not null default 14 check(new_days between 1 and 365),
 frequent_days int not null default 30 check(frequent_days between 1 and 365),
 frequent_visits int not null default 3 check(frequent_visits between 1 and 100),
 risk_from int not null default 31 check(risk_from between 1 and 730),
 lost_after int not null default 60 check(lost_after between 2 and 731),
 risk_visits int not null default 2 check(risk_visits between 1 and 100),
 check(risk_from<=lost_after)
);
alter table nival_pr.segment_settings enable row level security;
revoke all on nival_pr.segment_settings from public;
grant select,insert,update on nival_pr.segment_settings to npr_v2_owner,npr_v2_admin;
create policy owner_scope on nival_pr.segment_settings to npr_v2_owner using(nival_pr.has_business(business_id)) with check(nival_pr.has_business(business_id));
create policy admin_scope on nival_pr.segment_settings to npr_v2_admin using(true) with check(true);
alter table nival_pr.review_reports drop constraint review_reports_period_check;
alter table nival_pr.review_reports add column period_kind text not null default 'month' check(period_kind in ('day','month','year'));
alter table nival_pr.review_reports drop constraint review_reports_business_id_period_key;
alter table nival_pr.review_reports add unique(business_id,period,period_kind);
alter table nival_pr.review_reports add check((period_kind='day') or (extract(day from period)=1 and (period_kind='month' or extract(month from period)=1)));
-- Invoker functions preserve table RLS; dates use the business timezone, never the browser timezone.
create function nival_pr.customer_segments(b uuid,as_of date default (now() at time zone 'America/Mexico_City')::date)
returns table(id uuid,name text,phone text,visits bigint,recent_visits bigint,first_visit date,last_visit date,is_new boolean,is_frequent boolean,is_risk boolean,is_lost boolean,absent_month boolean)
language sql stable security invoker set search_path='' as $$
 with cfg as (select coalesce(s.new_days,14) nd,coalesce(s.frequent_days,30) fd,coalesce(s.frequent_visits,3) fv,coalesce(s.risk_from,31) rf,coalesce(s.lost_after,60) la,coalesce(s.risk_visits,2) rv from (values(1)) t(x) left join nival_pr.segment_settings s on s.business_id=b),
 stats as (select c.id,c.name,c.phone,count(l.id) visits,count(l.id) filter(where (l.created_at at time zone 'America/Mexico_City')::date>as_of-cfg.fd) recent_visits,
 min((l.created_at at time zone 'America/Mexico_City')::date) first_visit,max((l.created_at at time zone 'America/Mexico_City')::date) last_visit
 from nival_pr.customers c cross join cfg left join nival_pr.point_ledger l on l.customer_id=c.id and l.business_id=b and l.type='visit' and (l.created_at at time zone 'America/Mexico_City')::date<=as_of where c.business_id=b group by c.id,c.name,c.phone,cfg.fd)
 select s.*,coalesce(s.first_visit>as_of-cfg.nd,false),s.recent_visits>=cfg.fv,
 coalesce(as_of-s.last_visit between cfg.rf and cfg.la and s.visits>=cfg.rv,false),coalesce(as_of-s.last_visit>cfg.la,false),
 coalesce(s.last_visit<date_trunc('month',as_of)::date,true) from stats s cross join cfg
$$;
revoke all on function nival_pr.customer_segments(uuid,date) from public;
grant execute on function nival_pr.customer_segments(uuid,date) to npr_v2_owner,npr_v2_admin;
create index ledger_visits_business_customer on nival_pr.point_ledger(business_id,customer_id,created_at) where type='visit';
insert into nival_pr.advice_templates(segment,text) values
('new','Tienes {n} clientes nuevos. En su siguiente visita, explica cómo consultar sus puntos y cuál es su próximo premio.'),
('new','Tienes {n} clientes nuevos. Pregunta qué los trajo al negocio y registra las respuestas para identificar qué canales funcionan.'),
('new','Tienes {n} clientes nuevos. Revisa que el mesero haya registrado sus visitas y les haya mostrado su tarjeta digital.'),
('frequent','Tienes {n} clientes frecuentes. Pregúntales qué producto volverían a pedir y usa sus respuestas al planear tu menú.'),
('frequent','Tienes {n} clientes frecuentes. Revisa sus premios disponibles y recuerda al equipo ofrecer el canje cuando corresponda.'),
('frequent','Tienes {n} clientes frecuentes. Agradéceles personalmente su constancia en la próxima visita.'),
('risk','Tienes {n} clientes en riesgo. Escribe de forma individual para preguntar si hubo algo que podrías mejorar en su última visita.'),
('risk','Tienes {n} clientes en riesgo. Revisa su historial antes de escribirles y menciona su premio pendiente solo si realmente lo tienen.'),
('risk','Tienes {n} clientes en riesgo. Pregunta qué horarios les resultan cómodos antes de proponerles volver.'),
('lost','Tienes {n} clientes perdidos. Si aceptaron contacto, pregunta de forma individual si desean recibir novedades del negocio.'),
('lost','Tienes {n} clientes perdidos. Revisa si su última visita coincidió con cambios de horario o menú; usa esa información para investigar.'),
('lost','Tienes {n} clientes perdidos. Envía un saludo breve y deja claro que pueden pedir que no les escribas de nuevo.'),
('absent','Tienes {n} clientes que no han venido este mes. Consulta su historial antes de escribir y evita mensajes repetidos.'),
('absent','Tienes {n} clientes que no han venido este mes. Comparte una novedad concreta del negocio solo si ya está disponible.'),
('absent','Tienes {n} clientes que no han venido este mes. Si todavía no tienen visitas, explica cómo mostrar su QR al mesero.');
commit;
