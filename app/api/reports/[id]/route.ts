import {requireRole} from '../../../../lib/foundation/session';
import {query} from '../../../../lib/foundation/db';
import {reportPdf} from '../../../../lib/reputation/pdf';
export const runtime='nodejs';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const actor=await requireRole('superadmin','owner'),{id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response('No encontrado',{status:404});
 const [report]=await query(actor,"select r.*,b.name business_name,to_char(period_start,'YYYY-MM-DD') period_start,to_char(period_end,'YYYY-MM-DD') period_end from nival_pr.generated_reports r join nival_pr.businesses b on b.id=r.business_id where r.id=$1",[id]);
 if(!report)return new Response('No encontrado',{status:404});
 const bytes=await reportPdf(report);return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Nival-${report.kind}-${report.period_start}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
