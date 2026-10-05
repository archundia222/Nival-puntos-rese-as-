'use client';
import {useState} from 'react';
import {MovementForm} from './forms';
type CustomerSummary={id:string;name:string;phone:string|null;balance:number;atRisk:boolean;lastVisit:string|null;visits:number};
export function CustomerList({customers,goal}:{customers:CustomerSummary[];goal:number}){
 const[query,setQuery]=useState('');
 const normalized=query.trim().toLocaleLowerCase('es-MX');const digits=query.replace(/\D/g,'');
 const visible=customers.filter(c=>!normalized||c.name.toLocaleLowerCase('es-MX').includes(normalized)||(digits.length>0&&!!c.phone?.includes(digits)));
 return <section className="businesses"><h2>Clientes y puntos</h2><label className="filter">Buscar cliente por nombre o teléfono<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nombre o teléfono" autoComplete="off"/></label><p role="status">{visible.length} de {customers.length} clientes</p>{!customers.length?<p className="empty">Registra tu primer cliente.</p>:!visible.length?<p className="empty">No encontramos clientes con esos datos. Prueba con otro nombre o teléfono.</p>:visible.map(c=><article key={c.id}><div><h3>{c.name}</h3><p>{c.phone||'Sin teléfono'} · {c.balance} puntos{c.atRisk?' · En riesgo de no volver':''}</p><p>{c.visits} visitas registradas · {c.lastVisit?`Última visita: ${c.lastVisit}`:'Todavía no tiene visitas'}</p></div><MovementForm id={c.id} canRedeem={c.balance>=goal} goal={goal}/></article>)}</section>;
}
