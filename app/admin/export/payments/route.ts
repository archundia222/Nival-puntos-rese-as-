import {query} from '../../../../lib/foundation/db';
import {requireRole} from '../../../../lib/foundation/session';
function csv(v:unknown){const s=String(v??'');return '"'+s.replaceAll('"','""')+'"'}
export async function GET(){
 const actor=await requireRole('superadmin');
 const rows=await query(actor,`select p.id,b.name business,p.amount,p.method,p.reference,p.paid_at,p.period_start,p.period_end
 from nival_pr.payments p join nival_pr.businesses b on b.id=p.business_id order by p.paid_at desc`);
 const header=['id','business','amount','method','reference','paid_at','period_start','period_end'];
 const body=[header.join(','),...rows.map(r=>header.map(k=>csv(r[k])).join(','))].join('\n');
 return new Response('\uFEFF'+body,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="nival-pagos.csv"'}});
}