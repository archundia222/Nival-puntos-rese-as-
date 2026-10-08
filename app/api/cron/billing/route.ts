import {systemQuery} from '../../../../lib/foundation/db';
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret)return Response.json({error:'CRON_SECRET no configurado'},{status:503});
 if(request.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'No autorizado'},{status:401});
 const porVencer=await systemQuery("update nival_pr.businesses set status='por_vencer' where status='activo' and paid_until is not null and paid_until between now() and now()+interval '7 days' returning id");
 const pausados=await systemQuery("update nival_pr.businesses set status='pausado' where status in ('activo','por_vencer') and greatest(coalesce(paid_until,'-infinity'),coalesce(trial_ends_at,'-infinity'))<=now() returning id");
 return Response.json({ok:true,por_vencer:porVencer.length,pausados:pausados.length});
}