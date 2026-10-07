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
   }) => string;
   remove?: (widgetId: string) => void;
  };
 }
}

export function TurnstileWidget({siteKey}:{siteKey:string}){
 const containerRef=useRef<HTMLDivElement>(null);
 const widgetIdRef=useRef<string|null>(null);
 const [scriptReady,setScriptReady]=useState(false);

 useEffect(()=>{
  if(!scriptReady||!siteKey||!containerRef.current||!window.turnstile||widgetIdRef.current)return;
  widgetIdRef.current=window.turnstile.render(containerRef.current,{
   sitekey:siteKey,
   theme:"light",
   "response-field":true,
   "response-field-name":"cf-turnstile-response",
  });
  return ()=>{
   if(widgetIdRef.current&&window.turnstile?.remove)window.turnstile.remove(widgetIdRef.current);
   widgetIdRef.current=null;
  };
 },[scriptReady,siteKey]);

 if(!siteKey)return <p className="error">Protección anti-bot pendiente de configuración.</p>;

 return <>
  <Script
   src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
   strategy="afterInteractive"
   onLoad={()=>setScriptReady(true)}
  />
  <div ref={containerRef}/>
 </>;
}
