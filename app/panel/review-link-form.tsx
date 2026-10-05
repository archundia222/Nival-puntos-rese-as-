'use client';
import {useActionState,useState} from 'react';
import {saveReviewLink,type ActionResult} from './actions';

export function ReviewLinkForm({name,link,error}:{name:string;link:{id:string;display_name:string;google_url:string;active:boolean}|null;error:boolean}){
 const [state,action,pending]=useActionState(saveReviewLink,{} as ActionResult);
 const [copy,setCopy]=useState('');
 async function copyLink(){if(!link)return;try{await navigator.clipboard.writeText(new URL(`/opinar/${link.id}`,window.location.origin).href);setCopy('Enlace copiado.');}catch{setCopy('No se pudo copiar. Abre la página y copia su dirección.');}}
 return <section className="reviewBox"><h2>Tu enlace de reseñas</h2><p>Comparte una sola dirección con tus clientes o úsala en el QR de tu tarjeta.</p>{error?<p role="alert">La configuración de enlaces está pendiente. Puedes seguir usando las demás funciones.</p>:<><form className="configGrid" action={action}><label>Nombre público del negocio<input name="displayName" required maxLength={150} defaultValue={link?.display_name||name}/></label><label>Enlace de reseñas de Google<input name="googleUrl" type="url" required maxLength={2000} placeholder="https://g.page/r/…/review" defaultValue={link?.google_url||''}/></label><p>Copia el enlace de «Pedir reseñas» de tu ficha de Google.</p><label><input name="active" type="checkbox" defaultChecked={link?.active??true}/> Página activa</label><button disabled={pending}>{pending?'Guardando…':'Guardar enlace'}</button><p role="status" className={state.error?'error':''}>{state.error||state.success}</p></form>{link&&<div><div className="actions"><a href={`/opinar/${link.id}`} target="_blank" rel="noopener noreferrer">Abrir página de clientes</a><button type="button" onClick={copyLink}>Copiar enlace</button></div><p role="status">{copy||(!link.active?'Tu página está desactivada.':'')}</p></div>}</>}</section>;
}
