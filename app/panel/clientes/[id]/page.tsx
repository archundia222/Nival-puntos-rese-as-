import {notFound} from 'next/navigation';
import {query} from '../../../../lib/foundation/db';
import {requireRole,requireBusiness} from '../../../../lib/foundation/session';
import {entitlements} from '../../../../lib/foundation/entitlements.mjs';
import {ActionForm} from '../../../../lib/foundation/forms';
import {Hidden,Field} from '../../../../lib/foundation/fields';
import {adjustPoints} from '../../../../lib/points/actions';
export const dynamic='force-dynamic';
export default async function Customer({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{business?:string}>}){
 const actor=await requireRole('owner'),{id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const [c]=await query(actor,'select id,business_id,name,phone,created_at from nival_pr.customers where id=$1',[id]);if(!c)notFound();
 await requireBusiness(actor,c.business_id);
 const [b]=await query(actor,'select b.*,p.features from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id where b.id=$1',[c.business_id]);
 if(!entitlements(b).active)return <main className="dashboard"><a href={'/panel?business='+b.id}>Volver al panel</a><h1>Servicio inactivo</h1><p>Renueva para consultar tus clientes. El historial está guardado.</p></main>;
 const movements=await query(actor,"select l.*,r.name reward from nival_pr.point_ledger l left join nival_pr.rewards r on r.id=l.reward_id where l.customer_id=$1 and l.business_id=$2 order by l.created_at desc,l.id desc",[id,c.business_id]);
 const balance=movements.reduce((sum,row)=>sum+Number(row.points),0);
 return <main className="dashboard"><header className="dashHead"><div><small>CLIENTE · {b.name}</small><h1>{c.name}</h1><p>{balance} puntos · {c.phone}</p></div><a href={'/panel?business='+b.id+'#clientes'}>Volver a clientes</a></header><section className="reviewBox"><h2>Historial completo</h2>{!movements.length&&<p>La primera visita aparecerá aquí cuando tu personal confirme una compra.</p>}{movements.map(m=><article key={m.id} className="customerRow"><strong>{m.type==='visit'?'Visita':m.type==='redeem'?'Canje':'Ajuste'} · {Number(m.points)>0?'+':''}{m.points} puntos</strong><p>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}{m.reward?' · '+m.reward:''}</p>{m.note&&<p>Motivo: {m.note}</p>}<small>Operador: {m.staff_id} · Movimiento: {m.id}</small></article>)}</section><section className="reviewBox"><h2>Corregir puntos con motivo</h2><p>El ajuste agrega un movimiento; conserva el historial y no permite un saldo negativo.</p>{entitlements(b).points?<ActionForm action={adjustPoints} label="Registrar ajuste"><Hidden name="businessId" value={b.id}/><Hidden name="customerId" value={c.id}/><Field name="points" label="Puntos a sumar (+) o restar (−)" type="number" min={-100000} max={100000}/><label>Motivo del ajuste<textarea name="reason" required minLength={5} maxLength={500}/></label></ActionForm>:<p>Tu historial sigue disponible. Renueva para registrar ajustes.</p>}</section></main>;
}
