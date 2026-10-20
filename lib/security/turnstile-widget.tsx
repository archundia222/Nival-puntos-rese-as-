"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
 interface Window {
  turnstile?: {
   render: (container: HTMLElement, options: {
    sitekey: string;
    theme?: "light" | "dark" | "auto";
    "response-field"?: boolean;
    "response-field-name"?: string;
    callback?: (token: string) => void;
    "error-callback"?: (errorCode: string) => void;
    "expired-callback"?: () => void;
    "timeout-callback"?: () => void;
   }) => string;
   remove?: (widgetId: string) => void;
  };
 }
}

const ignoreTokenChange=()=>{};
export function TurnstileWidget({siteKey,onTokenChange=ignoreTokenChange}:{siteKey:string;onTokenChange?:(token:string)=>void}){
 const containerRef=useRef<HTMLDivElement>(null);
 const widgetIdRef=useRef<string|null>(null);
 const verifiedRef=useRef(false);
 const [scriptReady,setScriptReady]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{if(window.turnstile)setScriptReady(true);},[]);
 const [widgetError,setWidgetError]=useState("");

 // Turnstile can fail to load silently when a content blocker, private relay,
 // or network filter blocks challenges.cloudflare.com. Never leave the form
 // looking as though it is still validating forever.
 useEffect(()=>{
  if(!siteKey||widgetError)return;
  const timeout=window.setTimeout(()=>{
   if(!verifiedRef.current)setWidgetError("Cloudflare está tardando más de lo normal. Revisa tu conexión y vuelve a intentar la verificación.");
  },12000);
  return ()=>window.clearTimeout(timeout);
 },[siteKey,attempt,scriptReady,widgetError]);

 useEffect(()=>{
  if(!scriptReady||!siteKey||!containerRef.current||!window.turnstile||widgetIdRef.current)return;
  setWidgetError("");
  try{
   widgetIdRef.current=window.turnstile.render(containerRef.current,{
    sitekey:siteKey,
    theme:"light",
    "response-field":true,
    "response-field-name":"cf-turnstile-response",
    callback:(token)=>{verifiedRef.current=true;setWidgetError("");onTokenChange(token);},
    "error-callback":(errorCode)=>{onTokenChange("");setWidgetError(`Cloudflare no pudo completar la verificación (código ${errorCode}). Revisa tu conexión e inténtalo de nuevo.`);},
    "expired-callback":()=>{onTokenChange("");setWidgetError("La verificación venció. Espera a que se renueve para continuar.");},
    "timeout-callback":()=>{onTokenChange("");setWidgetError("La verificación tardó demasiado. Inténtalo de nuevo.");},
   });
  }catch{
   setWidgetError("No se pudo iniciar Cloudflare. Reintenta la verificación.");
  }
  return ()=>{
   if(widgetIdRef.current&&window.turnstile?.remove)window.turnstile.remove(widgetIdRef.current);
   widgetIdRef.current=null;
   onTokenChange("");
  };
 },[scriptReady,siteKey,onTokenChange,attempt]);

 if(!siteKey)return <p className="error" role="alert">Protección anti-bot pendiente de configuración.</p>;

 return <>
  <Script
   src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
   strategy="afterInteractive"
   onReady={()=>setScriptReady(true)}
   onError={()=>{onTokenChange("");setWidgetError("No se pudo cargar Cloudflare. Revisa la conexión y reintenta la verificación.");}}
  />
  <div ref={containerRef}/>
  {widgetError&&<div><p className="error" role="alert">{widgetError}</p><button type="button" onClick={()=>{verifiedRef.current=false;onTokenChange('');setWidgetError('');if(window.turnstile){setScriptReady(true);setAttempt(v=>v+1);}else window.location.reload();}}>Reintentar verificación</button></div>}
 </>;
}
