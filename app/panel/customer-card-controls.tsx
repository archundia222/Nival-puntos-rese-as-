'use client';
import {useActionState,useState} from 'react';
import {manageCustomerCard,type ActionResult} from './actions';
export function CustomerCardControls({id,token,enabled}:{id:string;token:string;enabled:boolean}){
 const [state,action,pending]=useActionState(manageCustomerCard,{} as ActionResult);const [copy,setCopy]=useState('');
 async function copyLink(){try{await navigator.clipboard.writeText(new URL(`/tarjeta/${token}`,window.location.origin).href);setCopy('Enlace copiado.');}catch{setCopy('Abre la tarjeta y copia su dirección.');}}
 return <div><form action={action} onSubmit={event=>{const button=(event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;if(button?.value==='rotate'&&!window.confirm('El enlace anterior dejará de funcionar. ¿Generar uno nuevo?'))event.preventDefault();}}><input type="hidden" name="customerId" value={id}/><div className="actions">{enabled?<><button type="button" onClick={copyLink}>Copiar tarjeta</button><a href={`/tarjeta/${token}`} target="_blank" rel="noopener noreferrer">Ver tarjeta</a><button name="operation" value="disable" disabled={pending}>Desactivar</button><button name="operation" value="rotate" disabled={pending}>Nuevo enlace</button></>:<button name="operation" value="enable" disabled={pending}>Activar tarjeta del cliente</button>}</div><p role="status" className={state.error?'error':''}>{state.error||state.success||copy}</p></form></div>;
}
