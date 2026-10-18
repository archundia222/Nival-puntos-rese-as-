"use client";
export type RewardMode="sequence"|"choose"|"random";
export type RewardScope="all"|"segments";
export type SegmentKey="new"|"frequent"|"at_risk"|"lost"|"absent";
export type RewardPolicy={
 scope:RewardScope;
 assignmentMode:RewardMode;
 segmentModes:Partial<Record<SegmentKey,RewardMode>>;
 targets:Record<string,string[]>;
 strategy:"manual"|"random";
};
export const audienceGroups:ReadonlyArray<{key:SegmentKey;label:string;description:string}>=[
 {key:"new",label:"Nuevos",description:"Clientes recién registrados"},
 {key:"frequent",label:"Frecuentes",description:"Visitan regularmente"},
 {key:"at_risk",label:"En riesgo",description:"Llevan tiempo sin regresar"},
 {key:"lost",label:"Inactivos",description:"Superaron el periodo de inactividad"},
 {key:"absent",label:"Sin visita",description:"Registrados sin visitas recientes"}
];
const choices:[RewardMode,string][]=[["sequence","En orden fijo"],["choose","Que el cliente elija"],["random","Al azar"]];
type Reward={id:string;name?:string;points_cost?:number};
export function SegmentPolicyEditor({policy,rewards,order,onPolicy,onOrder}:{policy:RewardPolicy;rewards:Reward[];order:string[];onPolicy:(next:RewardPolicy)=>void;onOrder:(ids:string[])=>void}){
 const update=(patch:Partial<RewardPolicy>)=>onPolicy({...policy,...patch});
 const targets=policy.targets||{};
 const selected=(key:string)=>targets[key]||[];
 const updateList=(key:string,id:string,checked:boolean)=>update({targets:{...targets,[key]:checked?[...selected(key),id]:selected(key).filter(x=>x!==id)}});
 const scope=policy.scope||"all";
 const renderRewards=(key:string)=> <div className="segmentPolicyRewards">{rewards.map(p=><label key={p.id}><input type="checkbox" checked={selected(key).includes(p.id)} onChange={e=>updateList(key,p.id,e.target.checked)} disabled={key==="all"&&selected(key).length===1&&selected(key)[0]===p.id}/><span>{p.name}<small>{p.points_cost} puntos</small></span></label>)}</div>;
 return <section className="wide segmentPolicyEditor" aria-labelledby="reward-policy-title">
  <header><h3 id="reward-policy-title">Cómo se asignan los premios</h3><p>Elige una regla para todos o una distinta por grupo de clientes.</p></header>
  <div className="segmentPolicyScope" role="group" aria-label="Alcance de la configuración">
   <button type="button" aria-pressed={scope==="all"} onClick={()=>update({scope:"all"})}>Igual para todos</button>
   <button type="button" aria-pressed={scope==="segments"} onClick={()=>update({scope:"segments"})}>Personalizar por grupo</button>
  </div>
  <label className="segmentPolicyMode">Regla general<select value={policy.assignmentMode||"sequence"} onChange={e=>update({assignmentMode:e.target.value as RewardMode})}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <div className="segmentPolicyBlock"><b>Premios disponibles para todos</b>{renderRewards("all")}</div>
  {(policy.assignmentMode==="sequence"||scope==="segments")&&<details className="segmentPolicyOrder"><summary>Orden de los premios</summary><ol>{order.map((id,index)=>{const reward=rewards.find(p=>p.id===id);if(!reward)return null;return <li key={id}><span>{reward.name}</span><div><button type="button" disabled={index===0} aria-label={"Subir "+reward.name} onClick={()=>{const next=[...order];[next[index],next[index-1]]=[next[index-1],next[index]];onOrder(next);}}>↑</button><button type="button" disabled={index===order.length-1} aria-label={"Bajar "+reward.name} onClick={()=>{const next=[...order];[next[index],next[index+1]]=[next[index+1],next[index]];onOrder(next);}}>↓</button></div></li>})}</ol></details>}
  {scope==="segments"&&<div className="segmentPolicyGroups">{audienceGroups.map(({key,label,description})=><details key={key} className="segmentPolicyGroup"><summary><b>{label}</b><small>{description}</small></summary><div className="segmentPolicyGroupBody"><label>Cómo reciben el premio<select value={policy.segmentModes?.[key]||"inherit"} onChange={e=>update({segmentModes:{...policy.segmentModes,[key]:e.target.value==="inherit"?undefined:e.target.value as RewardMode}})}><option value="inherit">Usar regla general</option>{choices.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label><div><b>Premios exclusivos para este grupo (opcional)</b><small>Si no seleccionas ninguno, se aplicarán los premios generales.</small>{renderRewards(key)}</div></div></details>)}</div>}
  <p className="segmentPolicyHelp">Las reglas se aplican al iniciar una nueva recompensa. Una meta ya bloqueada se conserva hasta su canje.</p>
 </section>;
}
