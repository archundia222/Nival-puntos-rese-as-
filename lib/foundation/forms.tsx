'use client';
import {useActionState,useEffect,useState,useRef} from 'react';
import {fieldErrorMessage} from './field-error.mjs';
import type {Result} from './actions';
export function ActionForm({action,children,label='Guardar',preserveOnError=false,showSubmit=true,submitDisabled=false}:{action:(state:Result,form:FormData)=>Promise<Result>;children:React.ReactNode;label?:string;preserveOnError?:boolean;showSubmit?:boolean;submitDisabled?:boolean}){
 const [state,submit,pending]=useActionState(action,{});const [copied,setCopied]=useState(false);const [fieldError,setFieldError]=useState('');const [origin,setOrigin]=useState('');useEffect(()=>setOrigin(window.location.origin),[]);
 const formRef=useRef<HTMLFormElement>(null);const saved=useRef<Array<{name:string;value:string;checked?:boolean}>>([]);
 useEffect(()=>{if(!preserveOnError||!state.error||pending)return;for(const item of saved.current){const control=formRef.current?.elements.namedItem(item.name);if(control instanceof HTMLInputElement){control.value=item.value;if(item.checked!==undefined)control.checked=item.checked;}else if(control instanceof HTMLSelectElement||control instanceof HTMLTextAreaElement)control.value=item.value;}},[state,pending,preserveOnError]);
 function remember(){setCopied(false);if(!preserveOnError)return;saved.current=Array.from(formRef.current?.elements||[]).flatMap<{name:string;value:string;checked?:boolean}>(control=>{if(control instanceof HTMLInputElement&&control.name&&!['password','file','hidden'].includes(control.type))return [{name:control.name,value:control.value,checked:control.type==='checkbox'?control.checked:undefined}];if((control instanceof HTMLSelectElement||control instanceof HTMLTextAreaElement)&&control.name)return [{name:control.name,value:control.value}];return [];});}
 function explainInvalid(event:React.FormEvent<HTMLFormElement>){
  const control=event.target;
  if(!(control instanceof HTMLInputElement||control instanceof HTMLSelectElement||control instanceof HTMLTextAreaElement))return;
  if(formRef.current?.querySelector(':invalid')!==control)return;
  const name=control.labels?.[0]?.childNodes[0]?.textContent?.trim()||'Este campo';
  const reason=fieldErrorMessage({label:name,type:control.type,validity:control.validity,minLength:control instanceof HTMLSelectElement?0:control.minLength,validationMessage:control.validationMessage});
  setFieldError(reason);
 }
 return <form onInvalid={explainInvalid} onInput={()=>setFieldError('')} ref={formRef} onSubmit={remember} action={submit} className="configGrid w-full">{children}{fieldError&&<p role="alert" className="error wide">{fieldError}</p>}{showSubmit&&<button disabled={pending||submitDisabled}>{pending?'Guardando…':label}</button>}{state.error&&<p role="alert" className="error wide">{state.error}</p>}{state.success&&<p role="status" className="wide">{state.success}</p>}{state.copyText&&<div className="wide resultCopy"><label>{state.copyLabel||'Código para compartir'}<input readOnly value={state.copyText} onClick={e=>e.currentTarget.select()}/></label><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(state.copyText!);setCopied(true);}catch{setCopied(false);}}}>{copied?'Copiado ✓':'Copiar código'}</button></div>}{state.link&&<p className="wide"><a href={state.link}>Abrir resultado</a><input aria-label="Enlace para compartir" readOnly value={origin?new URL(state.link,origin).href:state.link} onClick={e=>e.currentTarget.select()}/><small>Copia este enlace y entrégalo únicamente al cliente. Comparte los accesos de tarjeta únicamente con su titular.</small></p>}</form>;
}
