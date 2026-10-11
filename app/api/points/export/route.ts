import {NextResponse} from "next/server";
import {query} from "../../../../lib/foundation/db";
import {requireBusiness,requireRole} from "../../../../lib/foundation/session";
export const dynamic="force-dynamic";
function csv(value:unknown,formulaSafe=true){let text=String(value??"");if(formulaSafe&&/^[\s\u0000-\u001f]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
export async function GET(req:Request){
 try{
  const actor=await requireRole("owner"),url=new URL(req.url),businessId=url.searchParams.get("business")||"",kind=url.searchParams.get("kind")||"customers";
  if(!/^[0-9a-f-]{36}$/i.test(businessId)||!(["customers","movements"] as string[]).includes(kind))return new NextResponse("Solicitud inválida",{status:400});
  await requireBusiness(actor,businessId);
  const rows=kind==="customers"
   ? await query(actor,"select name,phone,created_at from nival_pr.customers where business_id=$1 order by created_at desc,id",[businessId])
   : await query(actor,"select c.name,l.type,l.points,r.name reward,l.created_at from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id left join nival_pr.rewards r on r.id=l.reward_id where l.business_id=$1 order by l.created_at desc,l.id desc",[businessId]);
  const headers=kind==="customers"?["Cliente","Teléfono","Fecha de registro"]:["Cliente","Movimiento","Puntos","Premio","Fecha"];
  const lines=[headers.map(x=>csv(x)).join(","),...rows.map((r:any)=>kind==="customers"?[csv(r.name),csv(r.phone),csv(r.created_at)]:[csv(r.name),csv(r.type==="visit"?"Visita":r.type==="redeem"?"Canje":"Ajuste"),csv(r.points,false),csv(r.reward),csv(r.created_at)]).map(x=>x.join(","))];
  const filename=`nival-${kind}-${new Date().toISOString().slice(0,10)}.csv`;
  return new NextResponse("\uFEFF"+lines.join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${filename}"`,"Cache-Control":"private, no-store"}});
 }catch{return new NextResponse("No autorizado",{status:401});}
}
