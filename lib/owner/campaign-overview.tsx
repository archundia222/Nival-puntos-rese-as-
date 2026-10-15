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
  ['all','Todos','clientes'],['new','Nuevos','check'],['frequent','Frecuentes','points'],
  ['at_risk','En riesgo','clock'],['lost','Perdidos','clock'],['absent','Sin visita este mes','trend']
 ] as const;
 const assigned=(key:string)=>active.filter(r=>Array.isArray(targets[key])?targets[key].includes(r.id):key==='all'&&r.id===active[0]?.id);
 const editUrl=demo?'/acceso':'/panel/puntos?business='+encodeURIComponent(businessId)+'&view=promociones#premios';
 return <>
  <div className="campaignHeading"><div className="ownerSectionTitle campaignIntro">
   <span className="workspaceEyebrow">CAMPAÑAS</span>
   <h2>Premios</h2>
  </div><a className="workspacePrimary campaignCreate" href={editUrl}><span aria-hidden="true">＋</span>{demo?'Ver premios':'Crear premio'}</a></div>
  {!active.length?<article className="ownerCard campaignEmpty">
   <div className="campaignCardArt"><Icon name="gift" size={42}/><span>PREMIO</span><i>✦</i></div>
   <div className="campaignEmptyText"><h3>Tu primer premio</h3></div>
  </article>:<>
   <div className="campaignRewardStrip" aria-label="Premios activos">{active.map((reward,index)=><article className="campaignRewardCard" key={reward.id}><span className="campaignRewardIcon"><Icon name="gift" size={20}/></span><strong>{reward.name}</strong><small>{reward.points_cost} pts</small><div className="campaignTargetTags">{segments.filter(([key])=>assigned(key).some(item=>item.id===reward.id)).map(([,label])=><span key={label}>{label}</span>)}</div><a href={editUrl} aria-label={'Editar premio '+reward.name}><Icon name="arrow" size={17}/></a></article>)}</div>
   {demo?<div className="campaignAudienceGrid">{segments.map(([key,label,icon])=><article className="campaignAudienceCard" key={key}><span className="campaignAudienceIcon"><Icon name={icon} size={22}/></span><strong>{label}</strong><span className="campaignAudienceStatus">Configura tu cuenta</span></article>)}</div>:branchId&&<section className="ownerCard campaignEditor">
    <header className="campaignEditorHeader"><span className="campaignBranchMark"><Icon name="pin" size={19}/></span><div><h3>Asigna premios por grupo</h3><span className="campaignBranchName">{branchName}</span></div></header>
    <ActionForm action={saveBranchCampaigns} label="Guardar">
     <Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId}/>
     <label className="campaignStrategyLabel">Orden<select name="strategy" defaultValue={rules.strategy||'manual'}><option value="manual">En el orden definido en Premios</option><option value="random">Al azar entre los elegidos</option></select></label>
     <div className="campaignAudienceGrid">{segments.map(([key,label,icon])=><fieldset className="campaignAudienceCard" key={key}><legend><span className="campaignAudienceIcon"><Icon name={icon} size={22}/></span><strong>{label}</strong></legend><div className="campaignChoices">{active.map(reward=><label className="campaignChoice" key={reward.id}><input type="checkbox" name={'target_'+key} value={reward.id} defaultChecked={assigned(key).some(item=>item.id===reward.id)}/><span><strong>{reward.name}</strong><small>{reward.points_cost} pts</small></span></label>)}</div></fieldset>)}</div>
    </ActionForm><p className="campaignDeliveryNote">Todos necesita un premio. Los grupos vacíos usan el de Todos.</p><p className="campaignDeliveryNote">Los premios aparecen en la tarjeta. No se envían mensajes automáticamente.</p>
   </section>}
  </>}
 </>;
}
