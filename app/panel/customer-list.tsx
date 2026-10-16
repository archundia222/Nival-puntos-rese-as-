'use client';
import {useState} from 'react';
import {CustomerCardControls} from './customer-card-controls';
import {MovementForm} from './forms';
type CustomerSummary={id:string;name:string;phone:string|null;balance:number;atRisk:boolean;lastVisit:string|null;visits:number;cardToken?:string;cardEnabled?:boolean};
export function CustomerList({customers,goal,showCards=true}:{customers:CustomerSummary[];goal:number;showCards?:boolean}){
 const[query,setQuery]=useState('');
 const normalized=query.trim().toLocaleLowerCase('es-MX');const digits=query.replace(/\D/g,'');
 const visible=customers.filter(c=>!normalized||c.name.toLocaleLowerCase('es-MX').includes(normalized)||(digits.length>0&&!!c.phone?.includes(digits)));
 return <section className="businesses customerDirectory" aria-labelledby="customer-list-title"><div className="directoryHeader"><h3 id="customer-list-title">Tu lista</h3><span>{customers.length} {customers.length===1?'cliente':'clientes'}</span></div><label className="filter">Buscar<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nombre o teléfono" autoComplete="off"/></label><p className="resultCount" role="status">{visible.length} de {customers.length}</p>{!customers.length?<p className="empty"><strong>Tu lista empieza aquí.</strong><br/>Registra a tu primer cliente para sumar visitas y llevar su progreso.</p>:!visible.length?<p className="empty">No encontramos clientes con esos datos. Prueba con otro nombre o teléfono.</p>:visible.map(c=><article className="customerRow" key={c.id}><div className="customerDetails"><h4>{c.name}</h4><p>{c.phone||'Sin teléfono'} <span className="dotDivider">·</span> {c.balance} puntos {c.atRisk&&<span className="riskTag">En riesgo</span>}</p><p>{c.visits} {c.visits===1?'visita':'visitas'}{c.lastVisit?` · Última: ${c.lastVisit}`:' · Aún sin visitas'}</p></div><div className="customerActions"><MovementForm id={c.id} canRedeem={c.balance>=goal} goal={goal}/>{showCards&&c.cardToken&&<CustomerCardControls key={c.cardToken+String(c.cardEnabled)} id={c.id} token={c.cardToken} enabled={!!c.cardEnabled}/>}</div></article>)}</section>;
}
