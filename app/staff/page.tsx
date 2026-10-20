import {foundationEnabled,query,authScope} from '../../lib/foundation/db';
import {requireRole} from '../../lib/foundation/session';
import {logout} from '../../lib/foundation/actions';
import {entitlements} from '../../lib/foundation/entitlements.mjs';
import {MovementWorkspace} from '../../lib/foundation/workspace';
import {redirect} from 'next/navigation';
import {InstallStaff} from '../../lib/points/install-staff';

export const metadata={manifest:'/staff.webmanifest',icons:{apple:'/staff-icon-192.png'},appleWebApp:{capable:true,title:'Nival Personal'}};
export const dynamic='force-dynamic';
const money=(value:unknown)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(Number(value)||0);

export default async function Staff({searchParams}:{searchParams:Promise<{view?:string}>}){
 if(!foundationEnabled())redirect('/staff/acceso');
 const actor=await requireRole('staff');if(!actor.businessId)redirect('/staff/acceso');
 const params=await searchParams,history=params.view==='historial';
 const [business]=await query(actor,'select id,name,status from nival_pr.businesses where id=$1',[actor.businessId]);
 const [branch]=await query(authScope(actor.id),"select br.name from nival_pr.memberships m join nival_pr.branches br on br.id=m.branch_id and br.business_id=m.business_id where m.user_id=$1 and m.business_id=$2 and m.role='staff' and m.active limit 1",[actor.id,actor.businessId]);
 const [context]=await query(authScope(actor.id),'select nival_pr_private.tool_context($1) data',[actor.businessId]);
 const active=entitlements(context?.data).active;
 const movements=active&&history?await query(actor,`select l.id,l.type,l.points,l.created_at,l.ticket_value_mxn,l.redemption_value_mxn,c.name customer,r.name reward,d.status from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id left join nival_pr.rewards r on r.id=l.reward_id left join nival_pr.redemptions d on d.ledger_id=l.id where l.business_id=$1 and l.staff_id=$2 order by l.created_at desc limit 100`,[actor.businessId,actor.id]):[];
 const [summary]=active&&history?await query(actor,`select count(*) filter(where type='visit')::int visits,coalesce(sum(points) filter(where type='visit'),0)::int points,count(*) filter(where type='redeem')::int redeemed,coalesce(sum(ticket_value_mxn) filter(where type='visit'),0)::numeric(12,2) tickets from nival_pr.point_ledger where business_id=$1 and staff_id=$2`,[actor.businessId,actor.id]):[];
 return <main className="dashboard staffDashboard">
  <header className="dashHead staffHeader"><div><small>NIVAL · PERSONAL</small><h1>{business?.name||'Tu negocio'}</h1><p className="staffIdentity"><strong>{actor.name}</strong><span>Trabajando en <b>{branch?.name||business?.name||'Sucursal asignada'}</b></span></p></div><form action={logout}><button>Cerrar sesión</button></form></header>
  <InstallStaff/>
  <nav className="staffTabs" aria-label="Personal"><a href="/staff" aria-current={!history?'page':undefined}>Registrar visita</a><a href="/staff?view=historial" aria-current={history?'page':undefined}>Historial y resultados</a></nav>
  {!active?<section className="staffInactive"><span>CUENTA DEL NEGOCIO</span><h2>Servicio inactivo</h2><p>Solicita al responsable del negocio que renueve el plan. Los movimientos guardados siguen disponibles cuando se reactive.</p></section>:!history?<MovementWorkspace key="scanner" actor={actor} businessId={actor.businessId}/>:<section className="staffResults" aria-labelledby="staff-results-title">
   <header className="staffResultsHeader"><div><small>TU ACTIVIDAD</small><h2 id="staff-results-title">Historial y resultados</h2><p>Todo lo que has registrado en el negocio.</p></div></header>
   <div className="staffMetrics">
    <article><span>Visitas registradas</span><strong>{summary?.visits||0}</strong><small>Clientes atendidos</small></article>
    <article><span>Puntos otorgados</span><strong>{summary?.points||0}</strong><small>En estas visitas</small></article>
    <article><span>Premios entregados</span><strong>{summary?.redeemed||0}</strong><small>Canjes registrados</small></article>
    <article><span>Ventas registradas</span><strong>{money(summary?.tickets)}</strong><small>Total de tickets atendidos</small></article>
   </div>
   <section className="staffHistory"><header><div><h3>Movimientos recientes</h3><p>Hasta los últimos 100 registros.</p></div></header>
    {!movements.length?<div className="staffHistoryEmpty"><span aria-hidden="true">↗</span><strong>Tu actividad aparecerá aquí</strong><p>Cuando registres una visita o entregues un premio, verás el detalle en esta lista.</p><a href="/staff">Registrar primera visita</a></div>:<ol className="staffMovementList">{movements.map(m=>{const visit=m.type==='visit';return <li key={m.id} className="staffMovement"><span className={'staffMovementMark '+(visit?'visit':'redeem')} aria-hidden="true">{visit?'↗':'✓'}</span><div className="staffMovementMain"><div className="staffMovementTitle"><strong>{m.customer}</strong><span>{visit?'Visita':'Premio entregado'}</span></div><small>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</small>{m.reward&&<p>{m.reward}{m.status?` · ${m.status==='approved'?'Aprobado':'Pendiente de revisión'}`:''}</p>}</div><div className="staffMovementNumbers"><strong className={visit?'earned':'spent'}>{visit?'+':''}{m.points} pts</strong><small>{visit?`Ticket ${money(m.ticket_value_mxn)}`:`Entregado ${money(m.redemption_value_mxn)}`}</small></div></li>})}</ol>}
   </section>
  </section>}
 </main>;
}
