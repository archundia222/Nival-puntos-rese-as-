'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {adjustPoints} from '../points/actions';
export function CustomerPointsAdjustment({businessId,customerId,customerName}:{businessId:string;customerId:string;customerName:string}){
 const [points,setPoints]=useState<1|2|-1|-2>(1),[reason,setReason]=useState(''),[confirm,setConfirm]=useState(false);
 return <ActionForm id="customer-points-adjust" action={adjustPoints} showSubmit={false} preserveOnError>
 <Hidden name="businessId" value={businessId}/><Hidden name="customerId" value={customerId}/><Hidden name="points" value={String(points)}/>
 <fieldset className="wide adjustmentChoice"><legend>Selecciona el ajuste</legend><div className="pointAdjustmentOptions">{([1,2,-1,-2] as const).map(value=><button type="button" key={value} aria-pressed={points===value} className={points===value?'workspacePrimary':'workspaceSecondary'} onClick={()=>{setPoints(value);setConfirm(false)}}>{value>0?'+':''}{value}</button>)}</div></fieldset>
 <label className="wide">Motivo del ajuste<textarea name="reason" required minLength={5} maxLength={500} value={reason} onChange={e=>{setReason(e.target.value);setConfirm(false)}}/></label>
 {!confirm?<button type="button" className="workspacePrimary wide" onClick={()=>{if(reason.trim().length>=5)setConfirm(true);else document.querySelector<HTMLTextAreaElement>('#customer-points-adjust textarea[name="reason"]')?.reportValidity()}}>Registrar ajuste</button>:<div className="ownerCard wide adjustmentConfirmation" role="group" aria-label="Confirmar ajuste"><strong>Confirmar ajuste</strong><p>Cliente: {customerName}</p><p>Puntos: {points>0?'+':''}{points}</p><p>Motivo: {reason}</p><div className="workspaceActionRow"><button type="submit" className="workspacePrimary">Confirmar</button><button type="button" className="workspaceSecondary" onClick={()=>setConfirm(false)}>Cancelar</button></div></div>}
 </ActionForm>;
}
