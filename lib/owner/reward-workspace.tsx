'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {addReward} from '../foundation/actions';
import {editReward} from '../points/actions';
import {RewardImageInput} from '../points/reward-image-input';
type Reward={id:string;name:string;points_cost:number;position:number;active:boolean;photo_url?:string|null;reward_type?:string;value_mxn?:number|null;stock?:number|null;weight?:number|null;expiry?:string};
export function RewardWorkspace({businessId,rewards,redemptions=[],periodStart}:{businessId:string;rewards:Reward[];redemptions?:Record<string,any>[];periodStart?:string}){
 const [selected,setSelected]=useState<string|null>(null);
 const [exit,setExit]=useState(false);
 const [notice,setNotice]=useState('');
 const current=rewards.find(x=>x.id===selected);
 function leave(){setSelected(null);setExit(false);setNotice('Cambios guardados');}
 function countRedemptions(name:string){return redemptions.filter(x=>x.reward===name&&(!periodStart||new Date(x.created_at).getTime()>=new Date(periodStart).getTime())).length;}
 return <section className="rewardWorkspace">
  {selected===null?<><div className="workspaceSectionHeader"><h2>Premios y recompensas</h2><button type="button" className="workspacePrimary" onClick={()=>{setSelected('new');setNotice('')}}>+ Agregar</button></div>
   {notice&&<p role="status">{notice}</p>}
   {!rewards.length&&<div className="starterRewardSample"><span className="workspaceExampleTag">Ejemplo</span><div className="campaignCardArt" aria-hidden="true">✦</div><strong>Tu primer premio</strong><small>6 puntos · Café de cortesía</small><button type="button" className="workspacePrimary" onClick={()=>setSelected('new')}>Crear primer premio →</button></div>}
   <div className="campaignRewardStrip rewardShowcase">{rewards.map(r=><button type="button" key={r.id} className="campaignRewardCard rewardShowcaseCard" onClick={()=>{setSelected(r.id);setNotice('')}} style={{cursor:'pointer',textAlign:'left'}}>
     {r.photo_url?<img src={r.photo_url} alt="" style={{width:'100%',height:140,objectFit:'cover',borderRadius:12}}/>:<div className="campaignCardArt rewardShowcaseIcon" aria-hidden="true">{r.reward_type==="discount"?"%":<img className="rewardGiftAsset" src="/assets/img/nival-gift.svg" alt="" />}</div>}
     <span className={"rewardStatus "+(r.active?"isActive":"isPaused")}>{r.active?"Activo":"Inactivo"}</span><strong>{r.name}</strong><span className="rewardPointsBadge">{r.points_cost} puntos</span><small>{countRedemptions(r.name)} canjes del periodo</small><span className="rewardEditHint">Editar →</span>
    </button>)}</div>
  </>:<div className="ownerCard rewardEditorPanel"><header className="workspaceSectionHeader"><h2>{current?'Editar premio':'Nuevo premio'}</h2><button type="button" className="workspaceSecondary" onClick={()=>setExit(true)}>Salir</button></header>
   {exit&&<div className="ownerCard" role="group" aria-label="Guardar los cambios"><strong>¿Deseas guardar los cambios?</strong><div className="workspaceActionRow">
    <button type="button" className="workspacePrimary" onClick={()=>{setExit(false);(document.getElementById('reward-edit-form') as HTMLFormElement|null)?.requestSubmit()}}>Guardar</button>
    <button type="button" className="workspaceSecondary" onClick={()=>{setSelected(null);setExit(false)}}>Salir sin guardar</button>
    <button type="button" className="workspaceSecondary" onClick={()=>setExit(false)}>Cancelar</button></div></div>}
   <ActionForm id="reward-edit-form" action={current?editReward:addReward} label={current?'Guardar cambios':'Crear premio'} onSuccess={leave}>
    <Hidden name="businessId" value={businessId}/>{current&&<Hidden name="rewardId" value={current.id}/>}
    <Field name="name" label="Nombre" value={current?.name||''}/>
    <label>Tipo<select name="rewardType" defaultValue={current?.reward_type||'product'}><option value="product">Producto</option><option value="discount">Descuento</option></select></label>
    <Field name="valueMxn" label="Valor (MXN)" type="number" min={0} max={1000000} step={0.01} required={false} value={current?.value_mxn??''}/>
    <RewardImageInput value={current?.photo_url||''}/>
    <Field name="cost" label="Puntos necesarios" type="number" min={1} max={100000} value={current?.points_cost??10}/>
    {current?<><details className="wide"><summary>Opciones</summary><Field name="weight" label="Peso para premio sorpresa" type="number" min={1} max={100} value={current.weight||1}/><Field name="stock" label="Cantidad disponible" type="number" min={0} max={100000} required={false} value={current.stock??''}/><Field name="expiry" label="Válido hasta" type="date" required={false} value={current.expiry||''}/><Field name="position" label="Orden" type="number" min={0} value={current.position}/></details><label><input name="active" type="checkbox" defaultChecked={current.active}/> Activo</label></>:<Hidden name="position" value={String(rewards.length?Math.max(...rewards.map(r=>r.position))+1:0)}/>}
   </ActionForm>
  </div>}
 </section>;
}
