"use client";
import Script from "next/script";

export function TurnstileWidget(){
 const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||process.env.NEXT_PUBLIC_TURNSTILE_PUBLIC_KEY;
 if(!key)return <p className="error">Protección anti-bot pendiente de configuración.</p>;
 return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/><div className="cf-turnstile" data-sitekey={key} data-theme="light" data-response-field-name="cf-turnstile-response"/></>;
}
