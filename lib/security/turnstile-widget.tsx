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
    "error-callback"?: (errorCode: string) => void;
    "expired-callback"?: () => void;
   }) => string;
   remove?: (widgetId: string) => void;
  };
 }
}

export function TurnstileWidget({siteKey}:{siteKey:string}){
 const containerRef=useRef<HTMLDivElement>(null);
 const widgetIdRef=useRef<string|null>(null);
 const [scriptReady,setScriptReady]=useState(false);
 const [widgetError,setWidgetError]=useState("");

 useEffect(()=>{
  if(!scriptReady||!siteKey||!containerRef.current||!window.turnstile||widgetIdRef.current)return;
  setWidgetError("");
  widgetIdRef.current=window.turnstile.render(containerRef.current,{
   sitekey:siteKey,
   theme:"light",
   "response-field":true,
   "response-field-name":"cf-turnstile-response",
   "error-callback":(errorCode)=>setWidgetError(`Cloudflare no pudo completar la verificación (código ${errorCode}). Recarga la página; si continúa, comparte este código para revisar el dominio o la conexión.`),
   "expired-callback":()=>setWidgetError("La verificación venció. Vuelve a intentarlo."),
  });
  return ()=>{
   if(widgetIdRef.current&&window.turnstile?.remove)window.turnstile.remove(widgetIdRef.current);
   widgetIdRef.current=null;
  };
 },[scriptReady,siteKey]);

 if(!siteKey)return <p className="error" role="alert">Protección anti-bot pendiente de configuración.</p>;

 return <>
  <Script
   src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
   strategy="afterInteractive"
   onLoad={()=>setScriptReady(true)}
   onError={()=>setWidgetError("No se pudo cargar la verificación anti-bot. Revisa la conexión e intenta recargar la página.")}
  />
  <div ref={containerRef}/>
  {widgetError&&<p className="error" role="alert">{widgetError}</p>}
 </>;
}
