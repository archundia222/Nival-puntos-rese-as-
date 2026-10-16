import {notFound} from 'next/navigation';
import {query} from '../../../../lib/foundation/db';
import {requireRole,requireBusiness} from '../../../../lib/foundation/session';
import {entitlements} from '../../../../lib/foundation/entitlements.mjs';
import {ActionForm} from '../../../../lib/foundation/forms';
import {Hidden,Field} from '../../../../lib/foundation/fields';
import {adjustPoints} from '../../../../lib/points/actions';
import {DashboardShell} from '../../../../lib/owner/shell';
import {logout} from '../../../../lib/foundation/actions';
import {Icon} from '../../../../lib/owner/icons';
import {customerPermissions} from '../../../../lib/owner/consent.mjs';
export const dynamic='force-dynamic';
export default async function Customer({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{business?:string}>}){
 const actor=await requireRole('owner'),{id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const [c]=await query(actor,'select id,business_id,name,phone,created_at from nival_pr.customers where id=$1',[id]);if(!c)notFound();
 await requireBusiness(actor,c.business_id);
 const permission=(await customerPermissions((text,values)=>query(actor,text,values),c.business_id)).find((row:Record<string,any>)=>row.id===c.id)?.marketing_consent===true;
 const [b]=await query(actor,'select b.*,p.features from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id where b.id=$1',[c.business_id]);
 if(!entitlements(b).active)return <main className="dashboard"><a href={'/panel?business='+b.id}>Volver al panel</a><h1>Servicio inactivo</h1><p>Renueva para consultar tus clientes. El historial está guardado.</p></main>;
 const movements=await query(actor,"select l.*,r.name reward,r.reward_type,d.id redemption_id,d.value_mxn,d.photo_path,p.full_name staff_name from nival_pr.point_ledger l left join nival_pr.rewards r on r.id=l.reward_id left join nival_pr.redemptions d on d.ledger_id=l.id left join nival_pr.profiles p on p.id=l.staff_id where l.customer_id=$1 and l.business_id=$2 order by l.created_at desc,l.id desc",[id,c.business_id]);
 const balance=movements.reduce((sum,row)=>sum+Number(row.points),0);
 const rawPhone=String(c.phone||'').replace(/\D/g,'');
 const whatsappNumber=rawPhone.length===10?'52'+rawPhone:rawPhone;
 const whatsappHref=permission&&whatsappNumber?'https://wa.me/'+whatsappNumber+'?text='+encodeURIComponent(`Hola ${c.name}, te escribimos de ${b.name}. ¿Cómo podemos ayudarte?`):null;
 const periodStart=Date.parse(String(b.paid_until||''))-30*86400000;
 const periodDay=Math.max(1,Math.min(30,Math.floor((Date.now()-(Number.isFinite(periodStart)?periodStart:Date.now()))/86400000)+1));
 return <DashboardShell pointsOnly={entitlements(b).points&&!entitlements(b).reviews} name={b.name} owner={actor.name} status="Activo" demo={false} initialSection="clientes" homeUrl={'/panel?business='+b.id} planName={b.plan_name||'Puntos'} price={Number(b.price_mxn||299)} responseLimit={Number(b.features?.review_limit||0)} periodDay={periodDay} logout={<form action={logout}><button className="logoutButton" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button></form>}><main className="ownerDashboard"><header className="dashHead"><div><small>CLIENTE · {b.name}</small><h1>{c.name}</h1><p>{balance} puntos · {c.phone}</p></div><div className="workspaceActionRow">{whatsappHref&&<a className="workspacePrimary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Enviar mensaje por WhatsApp</a>}{!permission&&<small className="messageConsentNote">Este cliente no autorizó mensajes de promociones.</small>}<a className="customerBackLink" href={'/panel?business='+b.id+'#clientes'}>Volver a clientes</a></div></header><section className="reviewBox"><h2>Visitas y canjes</h2>{!movements.length&&<p>La primera visita aparecerá aquí cuando tu personal confirme una compra.</p>}{movements.map(m=><article key={m.id} className="customerRow"><strong>{m.type==='visit'?'Visita':m.type==='redeem'?'Canje':'Ajuste'} · {Number(m.points)>0?'+':''}{m.points} puntos</strong><p>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}{m.reward?' · '+m.reward:''}</p>{m.type==='redeem'&&<p>{m.reward_type==='discount'?'Descuento':'Producto'} · {m.value_mxn!==null?`$${Number(m.value_mxn).toFixed(2)} MXN`:'Valor no registrado'}</p>}{m.redemption_id&&m.photo_path&&<a href={'/api/points/evidence?id='+m.redemption_id} target="_blank" rel="noreferrer"><img src={'/api/points/evidence?id='+m.redemption_id} alt="Foto del ticket del canje" width="180" height="160"/></a>}{m.note&&<p>Motivo: {m.note}</p>}<small>Empleado: {m.staff_name||'—'}</small></article>)}</section><section className="reviewBox"><h2>Corregir puntos con motivo</h2><p>El ajuste agrega un movimiento; conserva el historial y no permite un saldo negativo.</p>{entitlements(b).points?<ActionForm action={adjustPoints} label="Registrar ajuste"><Hidden name="businessId" value={b.id}/><Hidden name="customerId" value={c.id}/><Field name="points" label="Puntos a sumar (+) o restar (−)" type="number" min={-100000} max={100000}/><label>Motivo del ajuste<textarea name="reason" required minLength={5} maxLength={500}/></label></ActionForm>:<p>Tu historial sigue disponible. Renueva para registrar ajustes.</p>}</section></main></DashboardShell>;
}
