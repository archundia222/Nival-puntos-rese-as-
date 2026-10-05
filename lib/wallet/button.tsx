'use client';
import { useState } from 'react';
export function WalletButton({slug}:{slug:string}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function add() {
  if(busy)return;
  setBusy(true);setError('');
  try {
   const r=await fetch('/api/wallet/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug}),cache:'no-store'});
   const d=await r.json();
   if(!r.ok)throw Error(d.error||'Inténtalo de nuevo.');
   if(typeof d.url!=='string'||!d.url.startsWith('https://pay.google.com/gp/v/save/'))throw Error('Enlace no disponible.');
   window.location.assign(d.url);
  }catch(e){setError((e as Error).message);setBusy(false);}
 }
 return <section className="walletAction"><button type="button" onClick={add} disabled={busy} aria-label="Agregar a Google Wallet" aria-busy={busy}><img src="/wallet/add-es.svg" alt="Agregar a Google Wallet" width={244} height={48}/></button><p>Al agregarla, compartes con Google tu nombre, identificador de tarjeta y saldo.</p>{busy&&<p role="status">Preparando tu tarjeta…</p>}{error&&<p role="alert">{error}</p>}</section>;
}
