'use client';
import {useMemo,useState} from 'react';
type Item=Record<string,any>;
export function RedemptionTable({items,staff,branches,periodStart}:{items:Item[];staff:Item[];branches:Item[];periodStart?:string}){
 const [page,setPage]=useState(1);
 const [date,setDate]=useState(''),[branch,setBranch]=useState(''),[worker,setWorker]=useState(''),[reward,setReward]=useState('');
 const rewards=Array.from(new Set(items.map(x=>String(x.reward)))).sort();
 const rows=useMemo(()=>items.filter(x=>(!periodStart||new Date(x.created_at).getTime()>=new Date(periodStart).getTime())&&(!date||String(x.created_at).slice(0,10)===date)&&(!branch||x.branch_id===branch)&&(!worker||x.staff_id===worker)&&(!reward||x.reward===reward)),[items,periodStart,date,branch,worker,reward]);
 const pageCount=Math.max(1,Math.ceil(rows.length/10));
 const currentPage=Math.min(page,pageCount);
 const pageRows=rows.slice((currentPage-1)*10,currentPage*10);
 const knownValue=rows.reduce((sum,x)=>sum+(Number.isFinite(Number(x.value_mxn))&&x.value_mxn!==null?Number(x.value_mxn):0),0);
 const daily=useMemo(()=>{const tally=new Map<string,number>();rows.forEach(x=>{const day=String(x.created_at).slice(0,10);tally.set(day,(tally.get(day)||0)+1)});return Array.from(tally,([day,count])=>({day,count})).sort((a,b)=>a.day.localeCompare(b.day)).slice(-14);},[rows]);
 const maxDaily=Math.max(1,...daily.map(x=>x.count));
 return <div className="ownerCard" style={{display:'grid',gap:14}}>
  <div className="ownerMetrics"><article className="ownerMetric"><span>Canjes</span><strong>{rows.length}</strong></article><article className="ownerMetric"><span>Valor registrado</span><strong>{knownValue.toLocaleString('es-MX',{style:'currency',currency:'MXN'})}</strong></article></div>
  {daily.length>0&&<section className="redemptionTrend" aria-label="Canjes por día"><header><strong>Canjes por día</strong><small>Últimos {daily.length} días con movimientos en el filtro</small></header><div className="redemptionTrendBars" role="img" aria-label="Cantidad de canjes registrados por día">{daily.map(x=><div className="redemptionTrendDay" key={x.day}><span title={x.day+": "+x.count+" canjes"} style={{height:Math.max(12,100*x.count/maxDaily)+"%"}}/><small>{x.day.slice(5)}</small></div>)}</div></section>}
  <div className="explorerFilters"><label>Fecha<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label>Sucursal<select value={branch} onChange={e=>setBranch(e.target.value)}><option value="">Todas</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
   <label>Empleado<select value={worker} onChange={e=>setWorker(e.target.value)}><option value="">Todos</option>{staff.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label>Premio<select value={reward} onChange={e=>setReward(e.target.value)}><option value="">Todos</option>{rewards.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
  </div>
  {rows.length?<div style={{overflowX:'auto'}}><table className="customerTable"><thead><tr><th>Fecha y hora</th><th>Cliente</th><th>Premio</th><th>Valor</th><th>Empleado</th><th>Sucursal</th><th>Ticket</th></tr></thead><tbody>
   {pageRows.map(r=><tr key={r.id}>
    <td>{new Date(r.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</td><td>{r.customer}</td><td>{r.reward}</td>
    <td>{r.value_mxn===null||r.value_mxn===undefined?'—':Number(r.value_mxn).toLocaleString('es-MX',{style:'currency',currency:'MXN'})}</td>
    <td>{staff.find(x=>x.id===r.staff_id)?.name||'—'}</td><td>{branches.find(x=>x.id===r.branch_id)?.name||'—'}</td>
    <td>{r.photo_path?<a href={String(r.photo_path).startsWith('/assets/demo/')?String(r.photo_path):'/api/points/evidence?id='+encodeURIComponent(r.id)} target="_blank" rel="noreferrer"><img alt="Ver ticket completo" src={String(r.photo_path).startsWith('/assets/demo/')?String(r.photo_path):'/api/points/evidence?id='+encodeURIComponent(r.id)} width="52" height="52" style={{objectFit:'cover',borderRadius:8}}/></a>:'—'}</td>
   </tr>)}</tbody></table><nav className="nivalPagination" aria-label="Páginas de canjes"><button type="button" disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</button>{Array.from({length:pageCount},(_,i)=><button type="button" key={i} aria-current={currentPage===i+1?'page':undefined} onClick={()=>setPage(i+1)}>{i+1}</button>)}<button type="button" disabled={currentPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>Siguiente</button></nav></div>:<p className="ownerEmpty">No hay canjes que coincidan con estos filtros.</p>}
 </div>;
}
