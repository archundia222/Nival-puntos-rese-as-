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
 const [scriptReady,setScriptReady]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{if(window.turnstile)setScriptReady(true);},[]);
 const [widgetError,setWidgetError]=useState("");

 useEffect(()=>{
  if(!scriptReady||!siteKey||!containerRef.current||!window.turnstile||widgetIdRef.current)return;
  setWidgetError("");
  widgetIdRef.current=window.turnstile.render(containerRef.current,{
   sitekey:siteKey,
   theme:"light",
   "response-field":true,
   "response-field-name":"cf-turnstile-response",
   callback:(token)=>{setWidgetError("");onTokenChange(token);},
   "error-callback":(errorCode)=>{onTokenChange("");setWidgetError(`Cloudflare no pudo completar la verificación (código ${errorCode}). Revisa tu conexión e inténtalo de nuevo.`);},
   "expired-callback":()=>{onTokenChange("");setWidgetError("La verificación venció. Espera a que se renueve para continuar.");},
   "timeout-callback":()=>{onTokenChange("");setWidgetError("La verificación tardó demasiado. Inténtalo de nuevo.");},
  });
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
   onError={()=>{onTokenChange("");setWidgetError("No se pudo cargar la verificación anti-bot. Revisa la conexión e intenta recargar la página.");}}
  />
  <div ref={containerRef}/>
  {widgetError&&<div><p className="error" role="alert">{widgetError}</p><button type="button" onClick={()=>{onTokenChange('');setWidgetError('');if(window.turnstile){setScriptReady(true);setAttempt(v=>v+1);}else window.location.reload();}}>Reintentar verificación</button></div>}
 </>;
}
