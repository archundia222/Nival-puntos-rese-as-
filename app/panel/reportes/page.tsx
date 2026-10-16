import {entitlements} from '../../../lib/foundation/entitlements.mjs';
import {requireRole,requireBusiness} from '../../../lib/foundation/session';
import {query} from '../../../lib/foundation/db';
import {ReportView} from '../../../lib/reputation/report-view';
import {DashboardShell} from '../../../lib/owner/shell';
import {logout} from '../../../lib/foundation/actions';
import {Icon} from '../../../lib/owner/icons';
export const dynamic='force-dynamic';
export default async function Reports({searchParams}:{searchParams:Promise<{business?:string;branch?:string}>}){
 const actor=await requireRole('owner'),params=await searchParams;const businesses=await query(actor,'select b.*,p.features,p.name plan_name,p.price_mxn from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name');
 const b=params.business?businesses.find(b=>b.id===params.business):businesses[0];if(!b)return <main className="dashboard"><a href="/panel">Volver al panel</a><p>Negocio no encontrado.</p></main>;
 await requireBusiness(actor,b.id);const price=Number(b.price_mxn||299),responseLimit=Number(b.features?.review_limit||0),planName=price>=549?'Plus':price>=399?'Esencial':'Puntos';const periodStart=Date.parse(String(b.paid_until||''))-30*86400000,periodDay=Number.isFinite(periodStart)?Math.max(1,Math.min(30,Math.floor((Date.now()-periodStart)/86400000)+1)):1;
 const branches=await query(actor,'select id,name from nival_pr.branches where business_id=$1 and active order by is_primary desc,name',[b.id]);
 const branch=branches.find(br=>br.id===params.branch)||null;
 const reports=await query(actor,"select r.*,b.name business_name,br.name branch_name,to_char(r.period_start,'YYYY-MM-DD') period_start,to_char(r.period_end,'YYYY-MM-DD') period_end from nival_pr.generated_reports r join nival_pr.businesses b on b.id=r.business_id left join nival_pr.branches br on br.id=r.branch_id where r.business_id=$1 and r.branch_id is not distinct from $2::uuid and r.kind='period_summary' and...[truncated]