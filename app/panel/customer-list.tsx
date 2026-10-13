'use client';
import {useState} from 'react';
import {CustomerCardControls} from './customer-card-controls';
import {MovementForm} from './forms';
type CustomerSummary={id:string;name:string;phone:string|null;balance:number;atRisk:boolean;lastVisit:string|null;visits:number;cardToken?:string;cardEnabled?:boolean};
type Segment='all'|'atRisk'|'neverVisited'|'new'|'frequent';
const segmentLabels:Record<Segment,string>={all:'Todos',atRisk:'En riesgo',neverVisited:'Sin visita',new:'Nuevos',frequent:'Frecuentes'};
export function CustomerList({customers,goal,groups,advice}:{customers:CustomerSummary[];goal:number;groups?:Record<Exclude<Segment,'all'>,string[]>;advice?:string}){
 const[query,setQuery]=useState('');
 const[segment,setSegment]=useState<Segment>('all');
 const normalized=query.trim().toLocaleLowerCase('es-MX');const digits=query.replace(/\D/g,'');
 const inSegment=(customer:CustomerSummary)=>segment==='all'||!groups||groups[segment].includes(customer.id);
 const visible=customers.filter(c=>inSegment(c)&&(!normalized||c.name.toLocaleLowerCase('es-MX').includes(normalized)||(digits.length>0&&!!c.phone?.includes(digits))));
 return <section className="businesses"><h2>Clientes</h2>{advice&&<p className="clientAdvice"><span>Consejo</span>{advice}</p>}{groups&&<div className="customerGroupControls" role="group" aria-label="Filtrar clientes por grupo">{(['all','atRisk','neverVisited','new','frequent'] as Segment[]).map(key=><button type="button" key={key} aria-pressed={segment===key} onClick={()=>setSegment(key)}>{segmentLabels[key]}{key!=='all'&&<span>{groups[key].length}</span>}</button>)}</div>}<label className="filter">Buscar cliente por nombre o teléfono<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nombre o teléfono" autoComplete="off"/></label><p role="status">{visible.length} de {groups&&segment!=='all'?groups[segment].length:customers.length} clientes</p>{!customers.length?<p className="empty">Registra tu primer cliente.</p>:!visible.length?<p className="empty">{normalized?'No encontramos clientes con esos datos. Prueba con otro nombre o teléfono.':segment==='all'?'No hay clientes registrados todavía.':`No hay clientes en el grupo «${segmentLabels[segment]}».`}</p>:visible.map(c=><article key={c.id}><div><h3>{c.name}</h3><p>{c.phone||'Sin teléfono'} · {c.balance} puntos{c.atRisk?' · En riesgo de no volver':''}</p><p>{c.visits} visitas registradas · {c.lastVisit?`Última visita: ${c.lastVisit}`:'Todavía no tiene visitas'}</p></div><div><MovementForm id={c.id} canRedeem={c.balance>=goal} goal={goal}/>{c.cardToken&&<CustomerCardControls key={c.cardToken+String(c.cardEnabled)} id={c.id} token={c.cardToken} enabled={!!c.cardEnabled}/>}</div></article>)}</section>;
}
