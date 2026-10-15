import {Icon} from './icons';
import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {saveBranchCampaigns} from './actions';

type Promotion={id:string;name:string;points_cost:number;active?:boolean;expires_at?:string|null;stock?:number|null};
type CampaignRules={strategy?:'manual'|'random';targets?:Record<string,string[]>};

export function CampaignOverview({businessId,demo,program,rewards,branchName,branchId,branchRules}:{businessId:string;demo:boolean;program?:Record<string,any>;rewards:Promotion[];branchName:string;branchId?:string;branchRules?:CampaignRules|null}){
 const active=rewards.filter(r=>r.active!==false&&(!r.expires_at||Date.parse(r.expires_at)>Date.now())&&(r.stock==null||Number(r.stock)>0));
 const rules:CampaignRules=branchRules||program?.rules?.campaign_rules||{};
 const targets=rules.targets||{};
 const segments=[
  ['all','Todos los clientes','Un premio para cualquier cliente.'],
  ['frequent','Frecuentes','Agradece que vuelvan seguido.'],
  ['at_risk','En riesgo','Anímalos a regresar.']
 ] as const;
 const assigned=(key:string)=>active.filter(r=>Array.isArray(targets[key])&&targets[key].includes(r.id));
 const configured=segments.every(([key])=>assigned(key).length>0);
 const editUrl=demo?'/acceso':'/panel/puntos?business='+encodeURIComponent(businessId)+'&view=promociones#premios';
 return <>
  <div className="ownerSectionTitle campaignIntro">
   <span className="workspaceEyebrow">PROMOCIONES</span>
   <h2>Elige qué premio recibe cada cliente</h2>
   <p>Primero crea un premio. Después asígnalo a los grupos que quieras.</p>
  </div>
  <div className="campaignWorkflow" aria-label="Pasos para configurar promociones">
   <article className={'campaignWorkflowStep'+(active.length?' isDone':' isCurrent')}>
    <span className="campaignStepNumber">{active.length?'✓':'1'}</span>
    <div className="campaignStepCopy"><small>PASO 1</small><h3>{active.length?'Premios activos':'Crea tu primer premio'}</h3><p>{active.length?'Ya puedes asignar promociones a tus clientes.':'El premio aparecerá en tu tarjeta de puntos.'}</p></div>
    <span className="campaignStepCount">{active.length} / 10 premios</span>
    <a className="workspacePrimary" href={editUrl}>{demo?'Entrar para configurar':active.length?'Administrar premios':'Crear premio'}</a>
   </article>
   <article className={'campaignWorkflowStep'+(active.length?' isCurrent':' isLocked')}>
    <span className="campaignStepNumber">2</span>
    <div className="campaignStepCopy"><small>PASO 2 · {branchName}</small><h3>Elige quién recibe cada premio</h3><p>{active.length?'Asigna un premio a todos, frecuentes o clientes en riesgo.':'Se activa cuando tengas un premio.'}</p></div>
    <span className="campaignStepStatus">{active.length?(configured?'Listo':'Pendiente'):'Primero crea un premio'}</span>
   </article>
  </div>
  {demo&&<p className="campaignDemoNote">Estás viendo una muestra. Los cambios se hacen desde la cuenta del negocio.</p>}
  {!demo&&branchId&&active.length>0&&<section className="ownerCard branchCampaignEditor campaignEditor">
   <header className="campaignEditorHeader"><span className="campaignStepNumber">2</span><div><h3>Asignar premios a clientes</h3><p>Esta regla se aplica al iniciar una meta nueva en {branchName}.</p></div></header>
   <ActionForm action={saveBranchCampaigns} label="Guardar cambios">
    <Hidden name="businessId" value={businessId}/>
    <Hidden name="branchId" value={branchId}/>
    <label className="wide campaignStrategyLabel">Si eliges varios premios
     <select name="strategy" defaultValue={rules.strategy||'manual'}>
      <option value="manual">Usar el primero de la lista</option>
      <option value="random">Elegir uno al azar</option>
     </select>
     <small>Elige uno o varios premios para cada grupo.</small>
    </label>
    {segments.map(([key,label,help])=><fieldset className="wide campaignSegment" key={key}>
     <legend><span>{label}</span><small>{help}</small></legend>
     <div className="campaignChoices">{active.map(r=><label className="campaignChoice" key={r.id}>
      <input type="checkbox" name={'target_'+key} value={r.id} defaultChecked={assigned(key).some(a=>a.id===r.id)}/>
      <span><strong>{r.name}</strong><small>{r.points_cost} puntos</small></span>
     </label>)}</div>
    </fieldset>)}
    <p className="wide campaignSaveHint">Los clientes que ya tienen una meta conservan su premio actual.</p>
   </ActionForm>
  </section>}
  {active.length>0&&<p className="campaignFootnote">Configuración de la sucursal seleccionada: {branchName}.</p>}
 </>;
}
