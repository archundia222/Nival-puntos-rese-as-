import {query,type Actor} from '../foundation/db';
export async function StartGuide({actor,businessId}:{actor:Actor;businessId:string}){
 const [state]=await query(actor,`select
 exists(select 1 from nival_pr.programs where business_id=$1) program,
 exists(select 1 from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0)) reward,
 exists(select 1 from nival_pr.point_ledger where business_id=$1 and type='visit') visit`,[businessId]);
 const base='/panel/puntos?business='+businessId+'&view=programa';
 const steps=[{done:state.program,label:'Personaliza tu tarjeta',text:'Nombre, color y puntos por compra.',href:base},
 {done:state.reward,label:'Define tu primer premio',text:'Elige algo atractivo y cuántos puntos necesita.',href:base+'#premios'},
 {done:state.visit,label:'Registra la primera visita',text:'Abre la tarjeta con un cliente y suma sus puntos.',href:'/panel/operar?business='+businessId}];
 if(steps.every(s=>s.done))return null;
 const next=steps.find(s=>!s.done)!;
 return <section className="ownerCard startGuide" aria-label="Preparar mi primera venta"><div><span className="workspaceEyebrow">LISTO PARA TU PRIMER CLIENTE</span><h2>{next.label}</h2><p>{next.text} Puedes operar tú mismo; agregar personal es opcional.</p></div><ol>{steps.map((s,i)=><li key={s.label} className={s.done?'isDone':''}><b>{s.done?'✓':i+1}</b><a href={s.href}>{s.label}</a><small>{s.done?'Completado':s.text}</small></li>)}</ol><a className="workspacePrimary" href={next.href}>Continuar con este paso →</a></section>;
}
