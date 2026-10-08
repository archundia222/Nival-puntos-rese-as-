'use client';
import {PrintQr} from '../points/print-qr';
import {NfcSetup} from '../points/nfc-setup';
import {useEffect,useState} from 'react';
import {Icon} from './icons';
export function ShareTools({slug,name,demo}:{slug:string;name:string;demo:boolean}){
 const [origin,setOrigin]=useState(''),[feedback,setFeedback]=useState('');
 useEffect(()=>setOrigin(window.location.origin),[]);
 const url=origin+(demo?'/demo':'/b/'+encodeURIComponent(slug));
 const qrPath=demo?'/api/demo/qr':'/api/points/qr?slug='+encodeURIComponent(slug);
 async function copy(){try{await navigator.clipboard.writeText(url);setFeedback('Enlace copiado. Listo para compartir.');}catch{setFeedback('Mantén presionado el enlace para copiarlo.');}}
 return <><div className="shareWorkspace"><article className="ownerCard qrShowcase"><div className="qrFrame"><img src={qrPath} width="240" height="240" alt={'QR de la tarjeta de '+name}/></div><h3>Una visita. Un paso más.</h3><p>Coloca este QR donde tus clientes puedan verlo. Abre su tarjeta desde el celular.</p><a className="workspacePrimary" href={qrPath+(demo?'?':'&')+'download=1'} download><Icon name="download" size={16}/> Descargar QR</a>{demo&&<small>QR de ejemplo. No registra visitas en un negocio real.</small>}</article><article className="ownerCard shareLinkCard"><span className="workspaceEyebrow">EL ACCESO DE TUS CLIENTES</span><h3>Tu tarjeta, siempre a la mano</h3><p>Comparte el enlace por WhatsApp, en tus redes o desde una tarjeta NFC.</p><label>Enlace de la tarjeta<input readOnly value={origin?url:'Preparando enlace…'} onClick={e=>e.currentTarget.select()}/></label><div className="workspaceActionRow"><button type="button" className="workspacePrimary" onClick={copy} disabled={!origin}><Icon name="link" size={16}/> Copiar enlace</button>{!demo&&<a className="workspaceSecondary" href={'/b/'+slug} target="_blank" rel="noreferrer">Abrir tarjeta <Icon name="arrow" size={16}/></a>}</div>{feedback&&<p role="status" className="copyFeedback">{feedback}</p>}<div className="shareSteps"><div><b>01</b><span>Imprime el QR y colócalo en tu mostrador.</span></div><div><b>02</b><span>Invita al cliente a abrir su tarjeta.</span></div><div><b>03</b><span>Tu equipo registra cada visita desde su escáner.</span></div></div></article></div>{!demo&&<><details className="ownerCard printPoster"><summary>Cartel listo para el mostrador · imprimir o guardar PDF</summary><PrintQr name={name} slug={slug}/></details><NfcSetup name={name} slug={slug}/></>}</>;
}
