import {query,type Actor} from '../foundation/db';

export async function startGuideState(actor:Actor,businessId:string){
 const [state]=await query(actor,`select
 exists(select 1 from nival_pr.programs where business_id=$1) program,
 exists(select 1 from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0)) reward,
 exists(select 1 from nival_pr.point_ledger where business_id=$1 and type='visit') visit`,[businessId]);
 const base='/panel/puntos?business='+businessId+'&view=programa';
 const steps=[
  {done:state.program,label:'Configura tu tarjeta',text:'Elige su diseño y los puntos por visita.',action:'Configurar tarjeta',href:base+'#programa'},
  {done:state.reward,label:'Activa un premio',text:'Define qué recibe el cliente al juntar puntos.',action:'Crear premio',href:base+'#premios'},
  {done:state.visit,label:'Prueba una visita',text:'Registra una visita para ver el flujo completo.',action:'Registrar visita',href:'/panel/operar?business='+businessId},
 ];
 return {steps,complete:steps.every(s=>s.done),completed:steps.filter(s=>s.done).length};
}

type SetupState=Awaited<ReturnType<typeof startGuideState>>;
export async function StartGuide({state,actor,businessId}:{state?:SetupState;actor?:Actor;businessId?:string}){
 const current=state||(actor&&businessId?await startGuideState(actor,businessId):null);
 if(!current||current.complete)return null;
 const next=current.steps.find(s=>!s.done)!;
 return <section className="ownerCard startGuide" aria-labelledby="start-guide-title">
  <header className="startGuideHeading">
   <div><span className="workspaceEyebrow">EMPIEZA POR AQUÍ</span><h2 id="start-guide-title">Pon tu programa en marcha</h2><p>Completa estos pasos para empezar a sumar visitas y entregar premios.</p></div>
   <span className="startGuideProgress">{current.completed} de {current.steps.length} listos</span>
  </header>
  <ol aria-label="Pasos para configurar el programa">{current.steps.map((s,i)=><li key={s.label} className={s.done?'isDone':''}>
   <span className="startStepNumber" aria-hidden="true">{s.done?'✓':i+1}</span>
   <div><a href={s.href}>{s.label}</a><small>{s.done?'Listo':s.text}</small></div>
  </li>)}</ol>
  <a className="workspacePrimary startGuideNext" href={next.href}>{next.action} <span aria-hidden="true">→</span></a>
 </section>;
}
