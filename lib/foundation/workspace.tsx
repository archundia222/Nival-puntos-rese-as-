import {query,type Actor} from './db';
import {requireBusiness} from './session';
import {ActionForm} from './forms';
import {Hidden} from './fields';
import {movement} from './actions';
export async function MovementWorkspace({actor,businessId}:{actor:Actor;businessId:string}){
 await requireBusiness(actor,businessId);
 const [customers,rewards]=await Promise.all([
 query(actor,'select c.id,c.name,nival_pr.point_balance(c.id) as balance from nival_pr.customers c where c.business_id=$1 order by c.name limit 200',[businessId]),
 query(actor,'select r.id,r.name,r.points_cost from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active order by r.position',[businessId])
 ]);
 return <section className="reviewBox"><h2>Visitas y canjes</h2><p>Registra la visita después de atender al cliente. Abrir su tarjeta no suma puntos.</p>{!customers.length?<p>El propietario todavía no ha registrado clientes.</p>:<><ActionForm action={movement} label="Sumar visita"><Hidden name="businessId" value={businessId}/><Hidden name="type" value="visit"/><label>Cliente<select required name="customerId">{customers.map(c=><option key={c.id} value={c.id}>{c.name} · {String(c.balance)} puntos</option>)}</select></label></ActionForm>{rewards.length>0&&<ActionForm action={movement} label="Registrar canje"><Hidden name="businessId" value={businessId}/><Hidden name="type" value="redeem"/><label>Cliente<select required name="customerId">{customers.map(c=><option key={c.id} value={c.id}>{c.name} · {String(c.balance)} puntos</option>)}</select></label><label>Premio<select required name="rewardId">{rewards.map(r=><option key={r.id} value={r.id}>{r.name} · {r.points_cost} puntos</option>)}</select></label></ActionForm>}<p className="notice">Se muestran hasta 200 clientes. Busca por teléfono en el panel del propietario para administrar su tarjeta.</p></>}</section>;
}
