import 'server-only';
import {transaction,type Actor} from '../foundation/db';
/** Keep the administrator's daily queue aligned with active plans and real work. */
export async function syncServiceTasks(actor:Actor){
 await transaction(actor,[{text:`insert into nival_pr.tasks(business_id,title,status,due_date,recurrence)
 select b.id,s.title,'pendiente',s.due,s.recurrence
 from nival_pr.businesses b join nival_pr.plans p on p.id=b.plan_id
 cross join lateral (
  select 'Responder reseñas pendientes'::text title,(now() at time zone 'America/Mexico_City')::date due,null::text recurrence
   where coalesce((p.features->>'review_limit')::int,0)>0 and exists(select 1 from nival_pr.reviews rv where rv.business_id=b.id and rv.published_at is null)
  union all select 'Hacer resumen de reseñas',(now() at time zone 'America/Mexico_City')::date,null
   where coalesce((p.features->>'review_limit')::int,0)>0 and exists(select 1 from nival_pr.reviews rv where rv.business_id=b.id)
    and not exists(select 1 from nival_pr.review_reports rr where rr.business_id=b.id and rr.period>=(now() at time zone 'America/Mexico_City')::date-30 and nullif(trim(rr.notes),'') is not null)
  union all select 'Mandar recordatorio de fin de periodo',(b.paid_until at time zone 'America/Mexico_City')::date-3,'monthly'
   where b.paid_until is not null and b.status in ('activo','por_vencer') and b.paid_until>now() and b.paid_until<=now()+interval '3 days'
  union all select 'Mandar recordatorio de pago',(b.paid_until at time zone 'America/Mexico_City')::date-5,'monthly'
   where b.paid_until is not null and b.status in ('activo','por_vencer','pago_pendiente') and b.paid_until>now()-interval '5 days' and b.paid_until<=now()+interval '5 days'
  union all select 'Mandar PDF de resumen al cierre',(b.paid_until at time zone 'America/Mexico_City')::date,'monthly'
   where b.paid_until is not null and b.paid_until<=now()+interval '1 day' and b.paid_until>now()-interval '1 day'
    and not exists(select 1 from nival_pr.generated_reports r where r.business_id=b.id and r.status='approved' and r.period_end>now()-interval '30 days')
 ) s
 where b.status not in ('cancelado','registrado') and not exists(
  select 1 from nival_pr.tasks t where t.business_id=b.id and t.title=s.title
   and (t.status in ('pendiente','en_progreso') or (t.status='completada' and t.due_date>=s.due))
 ) on conflict do nothing` }]);
}
