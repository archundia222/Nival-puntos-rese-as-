'use client';
import {useState} from 'react';
import {Icon} from './icons';

export function CopyPayLink({url}:{url:string}){
 const [message,setMessage]=useState('');
 async function copy(){
  try{
   await navigator.clipboard.writeText(new URL(url,window.location.origin).toString());
   setMessage('Enlace copiado.');
  }catch{
   setMessage('No se pudo copiar. Mantén presionado el enlace para copiarlo.');
  }
 }
 return <><button type="button" className="workspaceSecondary" onClick={copy}><Icon name="link" size={15}/>Copiar enlace</button><small className="payCardCopyFeedback" role="status" aria-live="polite">{message}</small></>;
}
