import {notFound} from 'next/navigation';
import {query} from '../../../../lib/foundation/db';
import {requireRole} from '../../../../lib/foundation/session';
export const dynamic='force-dynamic';
export default async function AdminBusinessView({params}:{params:Promise<{id:string}>}){
 const actor=await requireRole('superadmin');const {id}=await params;
 const [business]=await query(actor,`select b.*,p.name plan_name,p.price_mxn from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id where b.id=$1`,[id]);
 if(!business)notFound();
 const [program]=await query(actor,'select * from nival_pr.programs where business_id=$1',[id]);
 const customers=await query(actor,'select c.id,c.name,c.phone,c.created_at,coalesce(sum(l.points),0)::int points from nival_pr.customers c left join nival_pr.point_ledger l on l.customer_id=c.id where c.business_id=$1 group by c.id order by c.created_at desc limit 100',[id]);
 const reports=await query(actor,'select * from nival_pr.review_reports where business_id=$1 order by period desc limit 12',[id]);
 return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · SOLO LECTURA</small><h1>{business.name}</h1><p>Vista del negocio para soporte. Ninguna acción se puede ejecutar aquí.</p></div><a href={'/admin?business='+business.id}>Volver a admin</a></header>
 <section className="reviewBox"><h2>Cuenta</h2><p><span className={'statusChip status-'+business.status}>{business.status}</span> · {business.plan_name||'Sin plan'} · {business.paid_until?new Date(business.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'Sin vigencia'}</p><p>{business.owner_name||'Sin dueño'} · {business.email||'Sin correo'} · {business.phone||'Sin teléfono'}</p></section>
 <section className="reviewBox"><h2>Programa</h2>{program?<p>{program.name} · {program.points_per_visit} punto(s) por visita · modo {program.mode}</p>:<p>No configurado.</p>}</section>
 <section className="reviewBox"><h2>Clientes</h2><table className="dataTable"><thead><tr><th>Cliente</th><th>Teléfono</th><th>Puntos</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.phone}</td><td>{c.points}</td></tr>)}</tbody></table></section>
 <section className="reviewBox"><h2>Reportes de Google</h2>{reports.map(r=><article className="customerRow" key={r.id}><b>{String(r.period).slice(0,7)}</b><p>{r.rating}★ · {r.total_reviews} totales · {r.new_reviews} nuevas · {r.answered} respondidas</p><p className="preserveLines">{r.notes}</p></article>)}</section>
 </main>
}