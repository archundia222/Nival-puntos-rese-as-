'use client';
import {useActionState,useEffect,useState} from 'react';
import type {Result} from './actions';
export function ActionForm({action,children,label='Guardar'}:{action:(state:Result,form:FormData)=>Promise<Result>;children:React.ReactNode;label?:string}){
 const [state,submit,pending]=useActionState(action,{});const [origin,setOrigin]=useState('');useEffect(()=>setOrigin(window.location.origin),[]);
 return <form action={submit} className="configGrid w-full">{children}<button disabled={pending}>{pending?'Guardando…':label}</button>{state.error&&<p role="alert" className="error wide">{state.error}</p>}{state.success&&<p role="status" className="wide">{state.success}</p>}{state.link&&<p className="wide"><a href={state.link}>Abrir nuevo acceso del cliente</a><input aria-label="Enlace para compartir" readOnly value={origin?new URL(state.link,origin).href:state.link} onClick={e=>e.currentTarget.select()}/><small>Copia este enlace y entrégalo únicamente al cliente. Da acceso a su tarjeta.</small></p>}</form>;
}
