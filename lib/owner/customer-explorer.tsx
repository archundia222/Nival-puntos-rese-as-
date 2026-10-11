'use client';
import {useState} from 'react';
import {filterCustomers,customerCsv} from './explorer.mjs';
import {formatCustomerVisitDate} from './domain.mjs';
import {Icon} from './icons';
export function CustomerExplorer({customers,demo=false,fixedSegment,businessId}:{customers:Record<string,any>[];demo?:boolean;fixedSegment?:string;businessId?:string}){
 const [search,setSearch]=useState(''),[segment,setSegment]=useState(fixedSegment||'all'),[sort,setSort]=useState('visits'),[page,setPage]=useState(1);
 const shown=filterCustomers(customers,search,segment,sort);
 const pages=Math.max(1,Math.ceil(shown.length/20)),currentPage=Math.min(page,pages);
 function download(){const url=URL.createObjectURL(new Blob([customerCsv(shown)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=demo?'clientes-demo.csv':'clientes-nival.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const groupTabs=[['clientes-new','Nuevos'],['clientes-frequent','Frecuentes'],['clientes-risk','En riesgo'],['clientes-absent','Sin visita este mes']];
 const advice:Record<string,string>={
  'clientes-risk':'Escríbeles con una promoción para invitarlos a volver.',
  'clientes-new':'Agradéceles su primera visita y ofréceles una promoción para que regresen.',
  'clientes-frequent':'Avísales cuántos puntos llevan y cuánto les falta para el siguiente premio.',
  'clientes-absent':'Recuérdales los puntos que ya tienen y ofréceles una promoción para este mes.',
 };
 const fixedRoute=fixedSegment?.startsWith('clientes-')?fixedSegment:fixedSegment?`clientes-${fixedSegment}`:undefined;
 const label=groupTabs.find(([id])=>id===fixedRoute)?.[1]||'Clientes';
 return <article className="ownerCard customerExplorer">
  {fixedSegment&&<><a className="customerBackLink" href="#inicio">‹ Volver a Inicio</a><nav className="customerGroupTabs" aria-label="Grupos de clientes">{groupTabs.map(([id,name])=><a key={id} href={'#'+id} aria-current={id===fixedRoute?'page':undefined}>{name}</a>)}</nav><div className="customerAdvice"><b>CONSEJO</b><p>{advice[fixedRoute||'']}</p></div></>}
  {!fixedSegment&&<div className="workspaceCardHead"><div><span className="workspaceEyebrow">DIRECTORIO DE CLIENTES</span><h3>Conoce a las personas que vuelven</h3></div><button type="button" className="workspaceSecondary" onClick={download} disabled={!shown.length}><Icon name="download" size={16}/> Exportar CSV</button></div>}
  {!fixedSegment&&<div className="explorerFilters"><label className="explorerSearch"><span>Buscar por nombre, teléfono, puntos, visitas o última visita</span><div><Icon name="search" size={18}/><input type="search" placeholder="Nombre, teléfono, puntos o fecha…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div></label><label>Ordenar por<select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="visits">Más visitas</option><option value="recent">Visita más reciente</option><option value="name">Nombre A–Z</option></select></label></div>}
  <p className="explorerCount" role="status">{shown.length} clientes {search?'coinciden con tu búsqueda':''}</p>
  <div className="customerTableWrap"><table className="customerTable"><thead><tr><th scope="col">Nombre</th>{fixedSegment?<><th scope="col">Teléfono</th><th scope="col">Última visita</th></>:<><th scope="col">Teléfono</th><th scope="col">Puntos</th><th scope="col">Visitas</th><th scope="col">Última visita</th></>}</tr></thead><tbody>{shown.slice((currentPage-1)*20,currentPage*20).map(c=><tr key={c.id}><td><span className="tableAvatar">{String(c.name).slice(0,1).toUpperCase()}</span>{businessId&&!demo?<a href={'/panel/clientes/'+c.id+'?business='+businessId}><strong>{c.name}</strong></a>:<strong>{c.name}</strong>}</td>{fixedSegment?<><td data-label="Teléfono">{c.phone||'—'}</td><td data-label="Última visita">{c.last_visit?formatCustomerVisitDate(c.last_visit):'Sin visitas'}</td></>:<><td data-label="Teléfono">{c.phone||'—'}</td><td data-label="Puntos"><b>{Number(c.balance||0)}</b></td><td data-label="Visitas"><b>{Number(c.visits||0)}</b></td><td data-label="Última visita">{c.last_visit?formatCustomerVisitDate(c.last_visit):'Sin visitas'}</td></>}</tr>)}</tbody></table></div>
  {!shown.length&&<p className="ownerEmpty">No hay clientes en este grupo.</p>}
  {shown.length>20&&<nav className="customerPagination" aria-label="Páginas de clientes"><button type="button" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Anterior</button><span role="status">Página {currentPage} de {pages}</span><button type="button" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>Siguiente</button></nav>}
 </article>;
}
