'use client';
import {useEffect,useState} from 'react';
export function StaffAccess({slug,id,name}:{slug:string;id:string;name:string}){
 const [url,setUrl]=useState(''),[feedback,setFeedback]=useState('');
 useEffect(()=>setUrl(window.location.origin+'/staff/acceso?negocio='+encodeURIComponent(slug)+'&persona='+encodeURIComponent(id)),[slug,id]);
 async function copy(){try{await navigator.clipboard.writeText(`Hola ${name}, este es tu acceso al programa de puntos: ${url}\nSolo necesitas ingresar tu PIN. Pídelo al dueño si no lo tienes.`);setFeedback('Acceso copiado. Compártelo con este integrante.');}catch{setFeedback('Selecciona y copia el enlace de acceso.');}}
 return <div className="staffAccess"><label>Enlace de acceso de {name}<input readOnly value={url} onClick={e=>e.currentTarget.select()}/></label><button type="button" disabled={!url} onClick={copy}>Copiar acceso para el empleado</button><p>Este enlace completa el negocio y el identificador. Entrega el PIN por separado.</p>{feedback&&<p role="status">{feedback}</p>}</div>;
}
