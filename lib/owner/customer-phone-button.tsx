'use client';
import {useState} from 'react';
export function CustomerPhoneButton({name,phone,allowed=true,demo=false}:{name:string;phone?:string|null;allowed?:boolean;demo?:boolean}){
 const [confirm,setConfirm]=useState(false);
 const digits=String(phone||'').replace(/\D/g,'');
 const number=digits.length===10?'52'+digits:digits;
 const available=!demo&&allowed&&/^52\d{10}$/.test(number);
 return <span className="customerPhoneControl"><button type="button" className="customerPhoneButton" aria-label={'Contactar a '+name} title={available?'Enviar mensaje':'WhatsApp no disponible'} disabled={!available} onClick={()=>setConfirm(true)}>📞</button>{confirm&&<span className="customerPhoneConfirm" role="dialog" aria-label="Confirmar mensaje"><strong>¿Deseas enviar un mensaje a este cliente?</strong><span className="customerPhoneActions"><a className="workspacePrimary" href={'https://wa.me/'+number} target="_blank" rel="noopener noreferrer" onClick={()=>setConfirm(false)}>Sí</a><button type="button" className="workspaceSecondary" onClick={()=>setConfirm(false)}>Cancelar</button></span></span>}</span>;
}
