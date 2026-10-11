import {entitlements} from '../../../lib/foundation/entitlements.mjs';
import {requireRole,requireBusiness} from '../../../lib/foundation/session';
import {query} from '../../../lib/foundation/db';
import {ReportView} from '../../../lib/reputation/report-view';
import {DashboardShell} from '../../../lib/owner/shell';
import {logout} from '../../../lib/foundation/actions';
import {Icon} from '../../../lib/owner/icons';
export const dynamic='force-dynamic';
export default async function Reports({searchParams}:{searchParams:Promise<{business?:string}>}){
 const actor=await requireRole('owner'),params=await searchParams;const businesses=await query(actor,'select b.*,p.features,p.name plan_name,p.price_mxn from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name');
 const b=params.business?businesses.find(b=>b.id===params.business):businesses[0];if(!b)return <main className="dashboard"><a href="/panel">Volver al panel</a><p>Negocio no encontrado.</p></main>;
 await requireBusiness(actor,b.id);const price=Number(b.price_mxn||299),responseLimit=Number(b.features?.review_limit||0),planName=price>=549?'Plus':price>=399?'Esencial':'Puntos';const periodStart=Date.parse(String(b.paid_until||''))-30*86400000,periodDay=Number.isFinite(periodStart)?Math.max(1,Math.min(30,Math.floor((Date.now()-periodStart)/86400000)+1)):1;
 const reports=await query(actor,"select r.*,b.name business_name,to_char(r.period_start,'YYYY-MM-DD') period_start,to_char(r.period_end,'YYYY-MM-DD') period_end from nival_pr.generated_reports r join nival_pr.businesses b on b.id=r.business_id where r.business_id=$1 and r.kind='period_summary' and r.status='approved' order by r.period_end desc limit 40",[b.id]);
 const active=entitlements(b).active;
 return <DashboardShell name={b.name} owner={actor.name} status={active?"Activo":"Inactivo"} demo={false} homeUrl={'/panel?business='+b.id} initialSection="informes" planName={planName} price={price} responseLimit={responseLimit} periodDay={periodDay} logout={<form action={logout}><button className="logoutButton" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button></form>}><main className="ownerDashboard"><section className="ownerBlock"><div className="ownerSectionTitle"><h2>Informes del periodo</h2><p>Al cierre del día 30 se genera el PDF con los datos clave incluidos en tu plan.</p></div>{reports.map(r=><ReportView key={r.id} report={r}/>)}{!reports.length&&<p className="ownerEmpty">El PDF aparecerá cuando cierre tu primer periodo activo.</p>}</section></main></DashboardShell>;
}
