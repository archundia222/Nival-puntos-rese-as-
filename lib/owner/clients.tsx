'use client';
import {useState,useEffect} from 'react';
import {generateAdvice} from './domain.mjs';
export function SegmentCard({title,description,segment,customers,templates,businessName,demo=false}:{title:string;description:string;segment:string;customers:Record<string,any>[];templates:{segment:string;text:string}[];businessName:string;demo?:boolean}){
 const [variant,setVariant]=useState(0),[limit,setLimit]=useState(5),[advice,setAdvice]=useState('');
 const count=customers.length;
 useEffect(()=>{let current=true;generateAdvice(segment,{count,templates,variant,businessName}).then(text=>{if(current)setAdvice(text);}).catch(()=>{if(current)setAdvice('No se pudo cargar el consejo. Inténtalo de nuevo.');});return ()=>{current=false;};},[segment,count,templates,variant,businessName]);
 return <article className="ownerCard segmentCard"><div className="segmentHead"><div><h3>{title}</h3><p>{description}</p></div><strong>{customers.length}</strong></div>
 {customers.length>0?<><div className="ownerAdvice"><p>{advice||'Preparando consejo…'}</p><button type="button" onClick={()=>setVariant(v=>(v+1)%3)}>Otro consejo</button></div>
 <ul className="segmentList">{customers.slice(0,limit).map(c=><CustomerContact key={c.id} customer={c} businessName={businessName} demo={demo}/>)}</ul>
 {customers.length>limit&&<button type="button" onClick={()=>setLimit(l=>l+20)}>Mostrar más · {customers.length-limit} restantes</button>}</>:
 <p className="ownerEmpty">No hay clientes en este segmento. Se actualizará al registrar visitas con el QR personal.</p>}</article>;
}
function CustomerContact({customer:c,businessName,demo=false}:{customer:Record<string,any>;businessName:string;demo?:boolean}){
 const [open,setOpen]=useState(false),[message,setMessage]=useState(`Hola ${c.name}, soy del equipo de ${businessName}. ¿Cómo estuvo tu última experiencia con nosotros? Si prefieres que no te escribamos de nuevo, avísanos.`);
 const raw=String(c.phone||'').replace(/\D/g,''),phone=raw.length===10?'52'+raw:raw;
 const valid=!demo&&c.marketing_consent===true&&/^52\d{10}$/.test(phone);
 return <li><div className="clientIdentity"><b>{c.name}</b><small>{c.visits} visitas · última: {c.last_visit?String(c.last_visit).slice(0,10):'sin visitas'}</small></div><button type="button" className="contactToggle" disabled={!demo&&c.marketing_consent!==true} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>Escribir por WhatsApp</button>
 {!demo&&c.marketing_consent!==true&&<small>Sin autorización para mensajes comerciales.</small>}{open&&<div className="contactComposer">{demo&&<small>Demo: ningún número real. En tu negocio este botón abrirá WhatsApp.</small>}<label>Mensaje para {c.name}<textarea value={message} maxLength={1500} onChange={e=>setMessage(e.target.value)}/></label>{valid&&message.trim()?<a className="ownerPrimary" href={'https://wa.me/'+phone+'?text='+encodeURIComponent(message)} target="_blank" rel="noreferrer">Abrir conversación</a>:<p>Revisa el teléfono y escribe un mensaje.</p>}<small>Revisa el mensaje y envíalo tú desde WhatsApp.</small></div>}</li>;
}
export function PeriodFilter({businessId,kind,value,demo=false}:{businessId:string;kind:string;value:string;demo?:boolean}){
 const [selected,setSelected]=useState(kind);
 return <form className="ownerFilter">{!demo&&<input type="hidden" name="business" value={businessId}/>}<label>Ver por<select name="kind" value={selected} onChange={e=>setSelected(e.target.value)}><option value="day">Día</option><option value="month">Mes</option><option value="year">Año</option></select></label><label>Periodo<input key={selected} name="period" type={selected==='day'?'date':selected==='month'?'month':'number'} required min={selected==='year'?2000:undefined} max={selected==='year'?2100:undefined} defaultValue={selected===kind?value:undefined}/></label><button>Aplicar</button></form>;
}
