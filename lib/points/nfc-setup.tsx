"use client";
import {useEffect,useState} from "react";
import {customerEntryUrl} from "./entry.mjs";
export function NfcSetup({name,slug}:{name:string;slug:string}){
 const [url,setUrl]=useState(""),[status,setStatus]=useState("");
 useEffect(()=>{try{setUrl(customerEntryUrl(window.location.origin,slug));}catch{setUrl("");}},[slug]);
 async function copy(){if(!url)return;try{await navigator.clipboard.writeText(url);setStatus("Enlace NFC copiado.");}catch{setStatus("No se pudo copiar. Selecciona el enlace manualmente.");}}
 return <section className="reviewBox">
  <small>NFC · ACCESO DEL CLIENTE</small><h2>Programa tu tarjeta o sticker NFC</h2>
  <p>Graba exactamente este enlace. El mismo enlace sirve para clientes nuevos y para quienes ya tienen tarjeta en este dispositivo.</p>
  <label>Enlace de {name}<input readOnly value={url} aria-label={"Enlace NFC de "+name}/></label>
  <div className="actions"><button type="button" onClick={copy} disabled={!url}>Copiar enlace NFC</button><a href={url||"#"} target="_blank" rel="noopener noreferrer" aria-disabled={!url}>Probar enlace</a></div>
  <p role="status">{status}</p>
  <ol><li>Abre una app para escribir etiquetas NFC.</li><li>Escribe una URL y pega este enlace.</li><li>Graba la etiqueta.</li><li>Acerca otro celular: debe abrir directamente el programa de {name}.</li></ol>
  <p><strong>No grabes</strong> el QR personal de un cliente ni un enlace de recuperación. La etiqueta del negocio siempre usa <code>/b/{slug}</code>.</p>
 </section>;
}
