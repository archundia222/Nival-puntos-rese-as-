import {query} from '../../../../lib/foundation/db';
import {requireRole} from '../../../../lib/foundation/session';
function csv(v:unknown){const s=String(v??'');return '"'+s.replaceAll('"','""')+'"'}
export async function GET(){
 const actor=await requireRole('superadmin');
 const rows=await query(actor,`select b.id,b.name,b.slug,b.giro,b.owner_name,b.phone,b.email,b.status,p.name plan,b.trial_ends_at,b.paid_until,b.created_at
 from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.created_at desc`);
 const header=['id','name','slug','giro','owner_name','phone','email','status','plan','trial_ends_at','paid_until','created_at'];
 const body=[header.join(','),...rows.map(r=>header.map(k=>csv(r[k])).join(','))].join('\n');
 return new Response('\uFEFF'+body,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="nival-negocios.csv"'}});
}