import 'server-only';
import {transaction,type Actor} from '../foundation/db';
/** Reconcile the agenda from subscriptions. Historical tasks are never deleted. */
export async function syncServiceTasks(actor:Actor){
 await transaction(actor,[{text:`insert into nival_pr.tasks(business_id,title,status,due_date,recurrence)
 select b.id,s.title,'pendiente',s.due,s.recurrence from nival_pr.businesses b join nival_pr.plans p on p.id=b.plan_id
 cross join lateral (
 select 'Cobrar mensualidad'::text title,(b.paid_until at time zone 'America/Mexico_City')::date-5 due,'monthly'::text recurrence where b.paid_until is not null and b.status<>'cancelado'
 union all select 'Puntos · revisar programa y premios',(now() at time zone 'America/Mexico_City')::date,null where b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now() and not exists(select 1 from nival_pr.programs pr join nival_pr.rewards rw on rw.program_id=pr.id and rw.active where pr.business_id=b.id)
 union all select 'Diagnóstico inicial: cargar reseñas y revisar reporte',(now() at time zone 'America/Mexico_City')::date,null where coalesce((p.features->>'points_only')::boolean,false)=false and b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now() and not exists(select 1 from nival_pr.generated_reports r where r.business_id=b.id and r.kind='diagnosis')
 union all select 'Revisar reseñas · seguimiento semanal',(now() at time zone 'America/Mexico_City')::date,'weekly' where coalesce((p.features->>'points_only')::boolean,false)=false and b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now()
 union all select 'Generar y aprobar reporte mensual',(b.paid_until at time zone 'America/Mexico_City')::date-2,'monthly' where coalesce((p.features->>'points_only')::boolean,false)=false and b.status in ('activo','por_vencer') and b.paid_until>now()
 ) s where not exists(select 1 from nival_pr.tasks t where t.business_id=b.id and t.title=s.title and (t.status in ('pendiente','en_progreso') or (t.status='completada' and t.due_date>=s.due))) on conflict do nothing` }]);
}
