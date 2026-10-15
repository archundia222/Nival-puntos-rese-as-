import {query,type Actor} from '../foundation/db';
import {Icon} from './icons';

export async function startGuideState(actor:Actor,businessId:string){
 const [state]=await query(actor,`select
 exists(select 1 from nival_pr.programs where business_id=$1) program,
 exists(select 1 from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0)) reward,
 exists(select 1 from nival_pr.point_ledger where business_id=$1 and type='visit') visit`,[businessId]);
 const base='/panel/puntos?business='+businessId+'&view=programa';
 const steps=[
  {done:state.program,label:'Tarjeta',icon:'card',action:'Diseñar tarjeta',href:base+'#programa'},
  {done:state.reward,label:'Premio',icon:'gift',action:'Crear premio',href:base+'#premios'},
  {done:state.visit,label:'Primera visita',icon:'check',action:'Registrar visita',href:'/panel/operar?business='+businessId},
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
   <div><span className="workspaceEyebrow">PUESTA EN MARCHA</span><h2 id="start-guide-title">Tu programa</h2></div>
   <span className="startGuideProgress">{current.completed} / {current.steps.length}</span>
  </header>
  <div className="startGuideTrack" role="progressbar" aria-label="Progreso del programa" aria-valuemin={0} aria-valuemax={current.steps.length} aria-valuenow={current.completed}><i style={{width:(current.completed/current.steps.length*100)+'%'}}/></div>
  <ol aria-label="Progreso del programa">{current.steps.map((s,i)=><li key={s.label} className={s.done?'isDone':s===next?'isCurrent':''} aria-current={s===next?'step':undefined}>
   <span className="startStepIcon"><Icon name={s.icon} size={22}/></span>
   <span>{s.label}</span>
  </li>)}</ol>
  <a className="workspacePrimary startGuideNext" href={next.href}>{next.action} <Icon name="arrow" size={17}/></a>
 </section>;
}
