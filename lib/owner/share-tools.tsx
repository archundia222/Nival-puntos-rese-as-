'use client';
import {useEffect,useState} from 'react';
import {Icon} from './icons';
export function ShareTools({slug,name,demo}:{slug:string;name:string;demo:boolean}){
 const [origin,setOrigin]=useState(''),[feedback,setFeedback]=useState('');
 useEffect(()=>setOrigin(window.location.origin),[]);
 const url=origin+(demo?'/demo/tarjeta':'/b/'+encodeURIComponent(slug));
 const qrPath=demo?'/api/demo/qr':'/api/points/qr?slug='+encodeURIComponent(slug);
 async function copy(){try{await navigator.clipboard.writeText(url);setFeedback('Copiado');}catch{setFeedback('Selecciona el enlace para copiarlo');}}
 return <section className="shareWorkspace" aria-label="Compartir tarjeta" style={{display:'grid',gap:18,gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))'}}>
  <div className="qrShowcase" style={{textAlign:'center'}}><div className="qrFrame"><img src={qrPath} width="240" height="240" alt={'Código QR de '+name}/></div><a className="workspaceSecondary" href={qrPath+(demo?'?':'&')+'download=1'} download><Icon name="download" size={16}/> Guardar QR</a></div>
  <div className="shareLinkCard" style={{display:'grid',alignContent:'center',gap:12}}>
   <label>Enlace<input readOnly value={origin?url:'Cargando…'} onClick={e=>e.currentTarget.select()}/></label>
   <button type="button" className="workspacePrimary" onClick={copy} disabled={!origin}><Icon name="link" size={16}/> Copiar</button>
   <a className="workspaceSecondary" href={demo?'/demo/tarjeta':'/b/'+encodeURIComponent(slug)} target="_blank" rel="noreferrer">Abrir tarjeta <Icon name="arrow" size={16}/></a>
   {feedback&&<small role="status">{feedback}</small>}
  </div>
 </section>;
}
