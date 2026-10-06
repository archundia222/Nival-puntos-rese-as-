"use client";
import Script from "next/script";

export function TurnstileWidget({siteKey}:{siteKey:string}){
 if(!siteKey)return <p className="error">Protección anti-bot pendiente de configuración.</p>;
 return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/><div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" data-response-field-name="cf-turnstile-response"/></>;
}
