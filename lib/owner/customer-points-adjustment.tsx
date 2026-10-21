'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {adjustPoints} from '../points/actions';
export function CustomerPointsAdjustment({businessId,customerId,customerName}:{businessId:string;customerId:string;customerName:string}){
 const [mode,setMode]=useState<'add'|'remove'>('add'),[quantity,setQuantity]=useState(1),[reason,setReason]=useState(''),[confirm,setConfirm]=useState(false);
 const points=(mode==='add'?1:-1)*quantity;
 return <ActionForm id="customer-points-adjust" action={adjustPoints} showSubmit={false} preserveOnError>
 <Hidden name="businessId" value={businessId}/><Hidden name="customerId" value={customerId}/><Hidden name="points" value={String(points)}/>
 <fieldset className="wide adjustmentChoice"><legend>Tipo de ajuste</legend><div className="workspaceActionRow"><button type="button" aria-pressed={mode==='add'} className={mode==='add'?'workspacePrimary':'workspaceSecondary'} onClick={()=>{setMode('add');setConfirm(false)}}>Sumar</button><button type="button" aria-pressed={mode==='remove'} className={mode==='remove'?'workspacePrimary':'workspaceSecondary'} onClick={()=>{setMode('remove');setConfirm(false)}}>Restar</button></div></fieldset>
 <fieldset className="wide adjustmentChoice"><legend>Cantidad de puntos</legend><div className="adjustmentQuantity"><button type="button" onClick={()=>{setQuantity(v=>Math.max(1,v-1));setConfirm(false)}} aria-label="Quitar un punto">−</button><strong>{quantity}</strong><button type="button" onClick={()=>{setQuantity(v=>Math.min(100000,v+1));setConfirm(false)}} aria-label="Agregar un punto">+</button></div><div className="workspaceActionRow">{[1,5,10,25].map(n=><button type="button" key={n} aria-pressed={quantity===n} className={quantity===n?'workspacePrimary':'workspaceSecondary'} onClick={()=>{setQuantity(n);setConfirm(false)}}>{n}</button>)}</div></fieldset>
 <label className="wide">Motivo del ajuste<textarea name="reason" required minLength={5} maxLength={500} value={reason} onChange={e=>{setReason(e.target.value);setConfirm(false)}}/></label>
 {!confirm?<button type="button" className="workspacePrimary wide" onClick={()=>{if(reason.trim().length>=5)setConfirm(true);else document.querySelector<HTMLTextAreaElement>('#customer-points-adjust textarea[name="reason"]')?.reportValidity()}}>Registrar ajuste</button>:<div className="ownerCard wide adjustmentConfirmation" role="group" aria-label="Confirmar ajuste"><strong>Confirmar ajuste</strong><p>Cliente: {customerName}</p><p>Puntos: {points>0?'+':''}{points}</p><p>Motivo: {reason}</p><div className="workspaceActionRow"><button type="submit" className="workspacePrimary">Confirmar</button><button type="button" className="workspaceSecondary" onClick={()=>setConfirm(false)}>Cancelar</button></div></div>}
 </ActionForm>;
}
