'use client';
import {useEffect,useState} from 'react';
import QRCode from 'qrcode';
export function StaffAccess({slug,id,name}:{slug:string;id:string;name:string}){
 const [url,setUrl]=useState(''),[qr,setQr]=useState(''),[feedback,setFeedback]=useState('');
 useEffect(()=>{const next=window.location.origin+'/staff/acceso?negocio='+encodeURIComponent(slug)+'&persona='+encodeURIComponent(id);setUrl(next);QRCode.toDataURL(next,{width:240,margin:2}).then(setQr).catch(()=>setQr(''));},[slug,id]);
 async function copy(){try{await navigator.clipboard.writeText(url);setFeedback('Enlace copiado');}catch{setFeedback('Selecciona el enlace para copiarlo');}}
 return <div className="staffAccess" style={{display:'grid',gap:12}}>
  <p><strong>ID:</strong> <code>{id}</code></p>
  {qr&&<img width="200" height="200" src={qr} alt={'Código QR de acceso de '+name}/>}
  <label>Enlace<input readOnly value={url} onClick={e=>e.currentTarget.select()}/></label>
  <button type="button" className="workspacePrimary" disabled={!url} onClick={copy}>Copiar enlace</button>
  {feedback&&<small role="status">{feedback}</small>}
 </div>;
}
