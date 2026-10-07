import {requireRole,requireBusiness} from '../../../lib/foundation/session';
import {query} from '../../../lib/foundation/db';
import {ReportView} from '../../../lib/reputation/report-view';
export const dynamic='force-dynamic';
export default async function Reports({searchParams}:{searchParams:Promise<{business?:string}>}){
 const actor=await requireRole('owner'),params=await searchParams;const businesses=await query(actor,'select id,name from nival_pr.businesses order by name');
 const b=params.business?businesses.find(b=>b.id===params.business):businesses[0];if(!b)return <main className="dashboard"><a href="/panel">Volver al panel</a><p>Negocio no encontrado.</p></main>;
 await requireBusiness(actor,b.id);const reports=await query(actor,"select r.*,b.name business_name,to_char(r.period_start,'YYYY-MM-DD') period_start,to_char(r.period_end,'YYYY-MM-DD') period_end from nival_pr.generated_reports r join nival_pr.businesses b on b.id=r.business_id where r.business_id=$1 and r.status='approved' order by r.created_at desc limit 40",[b.id]);
 return <main className="dashboard"><header className="dashHead"><h1>Reportes de {b.name}</h1><a href={'/panel?business='+b.id}>Volver a mi panel</a></header>{reports.map(r=><ReportView key={r.id} report={r}/>)}{!reports.length&&<p>Tu diagnóstico y próximos reportes aparecerán aquí cuando Nival los revise y publique.</p>}</main>;
}
