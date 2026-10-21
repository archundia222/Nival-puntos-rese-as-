'use client';
import {useState} from 'react';
import {filterCustomers,customerCsv} from './explorer.mjs';
import {formatCustomerVisitDate} from './domain.mjs';
import {Icon} from './icons';
import {CustomerPhoneButton} from './customer-phone-button';

type Customer=Record<string,any>;
function segmentFor(c:Customer){if(c.is_risk)return 'En riesgo';if(c.is_frequent)return 'Frecuente';if(c.is_new)return 'Nuevo';if(c.absent_month)return 'Sin visita este mes';if(!c.last_visit)return 'Sin visitas';return 'Cliente';}
function metric(value:unknown){return value===null||value===undefined||value===''?'—':Number(value).toLocaleString('es-MX');}
export function CustomerExplorer({customers,demo=false,fixedSegment,businessId}:{customers:Customer[];demo?:boolean;fixedSegment?:string;businessId?:string}){
 const [search,setSearch]=useState(''),[segment,setSegment]=useState(fixedSegment||'all'),[sort,setSort]=useState('visits'),[page,setPage]=useState(1);
 const shown=filterCustomers(customers,search,segment,sort),pages=Math.max(1,Math.ceil(shown.length/20)),currentPage=Math.min(page,pages),pageRows=shown.slice((currentPage-1)*20,currentPage*20);
 function download(){const url=URL.createObjectURL(new Blob([customerCsv(shown)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=demo?'clientes-demo.csv':'clientes-nival.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const customerHref=(c:Customer)=>businessId&&!demo?'/panel/clientes/'+c.id+'?business='+businessId:undefined;
 return <article className="ownerCard customerExplorer">
  {fixedSegment&&<div className="customerSegmentHeading"><a className="customerBackLink" href="#clientes">‹ Clientes</a><span className="customerSegmentPill">{segmentFor({is_risk:fixedSegment.includes('risk'),is_frequent:fixedSegment.includes('frequent'),is_new:fixedSegment.includes('new'),absent_month:fixedSegment.includes('absent')})}</span></div>}
  {!fixedSegment&&<div className="workspaceCardHead"><div><span className="workspaceEyebrow">DIRECTORIO</span><h3>Clientes</h3></div><button type="button" className="workspaceSecondary" onClick={download} disabled={!shown.length}><Icon name="download" size={16}/> Exportar</button></div>}
  {!fixedSegment&&<div className="explorerFilters"><label className="explorerSearch"><span>Buscar cliente</span><div><Icon name="search" size={18}/><input type="search" placeholder="Nombre, teléfono o visita…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div></label><label>Grupo<select value={segment} onChange={e=>{setSegment(e.target.value);setPage(1);}}><option value="all">Todos</option><option value="new">Nuevos</option><option value="frequent">Frecuentes</option><option value="risk">En riesgo</option><option value="lost">Inactivos</option><option value="absent">Sin visita este mes</option></select></label><label>Orden<select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="visits">Más visitas</option><option value="recent">Más recientes</option><option value="name">Nombre A–Z</option></select></label></div>}
  {!fixedSegment&&<><div className="workspaceActionRow" role="group" aria-label="Grupos de clientes">
   {[
    ['all','Todos',customers.length],
    ['new','Nuevos',customers.filter(c=>c.is_new).length],
    ['frequent','Frecuentes',customers.filter(c=>c.is_frequent).length],
    ['risk','En riesgo',customers.filter(c=>c.is_risk&&!c.is_lost).length],
    ['absent','Sin visita',customers.filter(c=>c.absent_month).length],
   ].map(([key,title,count])=><button type="button" key={String(key)} className={segment===key?'workspacePrimary':'workspaceSecondary'} onClick={()=>{setSegment(String(key));setPage(1)}}>{title} · {count}</button>)}
   </div>{segment==='risk'&&<p className="cardCaption">Invita a estos clientes a volver con una promoción.</p>}{segment==='new'&&<p className="cardCaption">Una bienvenida puede ayudar a generar una segunda visita.</p>}</>}
  {demo&&<p className="customerDemoNote">Perfiles y teléfonos ficticios · la demo no contacta a nadie.</p>}
  <div className="customerListMeta"><p className="explorerCount" role="status">{shown.length} {shown.length===1?'cliente':'clientes'}{search?' encontrados':''}</p><span>Ordenados por {sort==='visits'?'visitas':sort==='recent'?'última visita':'nombre'}</span></div>
  <div className="customerRows customerCardList">{pageRows.map(c=>{const href=customerHref(c);return <article className="customerListRow customerProfileCard" key={c.id}><div className="customerListIdentity"><span className="customerInitial" aria-hidden="true">{String(c.name||'?').slice(0,1).toUpperCase()}</span><div><strong>{c.name||'Cliente'}</strong>{c.is_new&&<span className="customerNewPill">Nuevo</span>}</div></div><div className="customerCardFacts"><div><small>Última visita</small><strong>{c.last_visit?formatCustomerVisitDate(c.last_visit):'Sin visitas'}</strong></div><div><small>Visitas</small><strong>{metric(c.visits)}</strong></div><div><small>Puntos</small><strong>{metric(c.balance)}</strong></div></div><div className="customerCardActions"><CustomerPhoneButton name={String(c.name||'Cliente')} phone={c.phone} allowed={c.marketing_consent===true} demo={demo}/>{href&&<a className="customerListOpen workspaceSecondary cardReturnButton" href={href}>Ver ficha <Icon name="arrow" size={16}/></a>}</div></article>;})}</div>
  {!shown.length&&<p className="ownerEmpty">No hay clientes en este grupo.</p>}
  {shown.length>20&&<nav className="customerPagination" aria-label="Páginas de clientes"><button type="button" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Anterior</button><span role="status">Página {currentPage} de {pages}</span><button type="button" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>Siguiente</button></nav>}
 </article>;
}
