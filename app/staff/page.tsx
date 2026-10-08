import {foundationEnabled,query,authScope} from '../../lib/foundation/db';
import {requireRole} from '../../lib/foundation/session';
import {logout} from '../../lib/foundation/actions';
import {entitlements} from '../../lib/foundation/entitlements.mjs';
import {MovementWorkspace} from '../../lib/foundation/workspace';
import {redirect} from 'next/navigation';
import {InstallStaff} from '../../lib/points/install-staff';
export const metadata={manifest:'/staff.webmanifest',icons:{apple:'/staff-icon-192.png'},appleWebApp:{capable:true,title:'Nival Personal'}};
export const dynamic='force-dynamic';
export default async function Staff({searchParams}:{searchParams:Promise<{view?:string}>}){
 if(!foundationEnabled())redirect('/staff/acceso');
 const actor=await requireRole('staff');if(!actor.businessId)redirect('/staff/acceso');
 const params=await searchParams,view=['sumar','canjear','historial'].includes(params.view||'')?params.view:'sumar';
 const [b]=await query(actor,'select id,name,status from nival_pr.businesses where id=$1',[actor.businessId]);
 const [context]=await query(authScope(actor.id),'select nival_pr_private.tool_context($1) data',[actor.businessId]);
 const active=entitlements(context?.data).active;
 const movements=active&&view==='historial'?await query(actor,`select l.id,l.type,l.points,l.created_at,c.name customer,r.name reward,d.status from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id left join nival_pr.rewards r on r.id=l.reward_id left join nival_pr.redemptions d on d.ledger_id=l.id where l.business_id=$1 and l.staff_id=$2 order by l.created_at desc limit 100`,[actor.businessId,actor.id]):[];
 const [summary]=active&&view==='historial'?await query(actor,`select count(*) filter(where type='visit')::int visits,coalesce(sum(points) filter(where type='visit'),0)::int points,count(*) filter(where type='redeem')::int redeemed from nival_pr.point_ledger where business_id=$1 and staff_id=$2`,[actor.businessId,actor.id]):[];
 return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · PERSONAL</small><h1>{b?.name||'Tu negocio'}</h1><p>{actor.name} · Tu actividad queda registrada con tu acceso.</p></div><form action={logout}><button>Cerrar sesión</button></form></header><InstallStaff/><nav className="staffTabs" aria-label="Operaciones del personal">{[['sumar','Sumar puntos'],['canjear','Canjear premios'],['historial','Mi historial y resultados']].map(([key,label])=><a key={key} href={'/staff?view='+key} aria-current={view===key?'page':undefined}>{label}</a>)}</nav>{!active?<section className="reviewBox"><h2>Servicio inactivo</h2><p>Solicita al responsable del negocio que renueve. Tus movimientos y los puntos de los clientes están guardados.</p></section>:view!=='historial'?<MovementWorkspace key={view} actor={actor} businessId={actor.businessId} mode={view==='canjear'?'redeem':'visit'}/>:<><section className="staffMetrics"><article>Visitas registradas<strong>{summary?.visits||0}</strong></article><article>Puntos otorgados<strong>{summary?.points||0}</strong></article><article>Premios canjeados<strong>{summary?.redeemed||0}</strong></article></section><section className="reviewBox"><h2>Mis últimos 100 movimientos</h2>{!movements.length?<p>Aquí aparecerán tus visitas y premios entregados.</p>:<div className="businessTableWrap"><table className="dataTable"><thead><tr><th>Fecha</th><th>Cliente</th><th>Operación</th><th>Puntos</th><th>Premio y estado</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</td><td>{m.customer}</td><td>{m.type==='visit'?'Visita':m.type==='redeem'?'Canje':'Ajuste'}</td><td>{m.points}</td><td>{m.reward||'—'} {m.status||''}</td></tr>)}</tbody></table></div>}</section></>}</main>;
}
