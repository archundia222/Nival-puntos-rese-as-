'use client';
import {useMemo,useState} from 'react';
type Item=Record<string,any>;
export function RedemptionTable({items,staff,branches}:{items:Item[];staff:Item[];branches:Item[]}){
 const [date,setDate]=useState(''),[branch,setBranch]=useState(''),[worker,setWorker]=useState(''),[reward,setReward]=useState('');
 const rewards=Array.from(new Set(items.map(x=>String(x.reward)))).sort();
 const rows=useMemo(()=>items.filter(x=>(!date||String(x.created_at).slice(0,10)===date)&&(!branch||x.branch_id===branch)&&(!worker||x.staff_id===worker)&&(!reward||x.reward===reward)),[items,date,branch,worker,reward]);
 const knownValue=rows.reduce((sum,x)=>sum+(Number.isFinite(Number(x.value_mxn))&&x.value_mxn!==null?Number(x.value_mxn):0),0);
 return <div className="ownerCard" style={{display:'grid',gap:14}}>
  <div className="ownerMetrics"><article className="ownerMetric"><span>Canjes</span><strong>{rows.length}</strong></article><article className="ownerMetric"><span>Valor registrado</span><strong>{knownValue.toLocaleString('es-MX',{style:'currency',currency:'MXN'})}</strong></article></div>
  <div className="explorerFilters"><label>Fecha<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label>Sucursal<select value={branch} onChange={e=>setBranch(e.target.value)}><option value="">Todas</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
   <label>Empleado<select value={worker} onChange={e=>setWorker(e.target.value)}><option value="">Todos</option>{staff.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label>Premio<select value={reward} onChange={e=>setReward(e.target.value)}><option value="">Todos</option>{rewards.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
  </div>
  {rows.length?<div style={{overflowX:'auto'}}><table className="customerTable"><thead><tr><th>Fecha y hora</th><th>Cliente</th><th>Premio</th><th>Valor</th><th>Empleado</th><th>Sucursal</th><th>Ticket</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.id}>
    <td>{new Date(r.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</td><td>{r.customer}</td><td>{r.reward}</td>
    <td>{r.value_mxn===null||r.value_mxn===undefined?'—':Number(r.value_mxn).toLocaleString('es-MX',{style:'currency',currency:'MXN'})}</td>
    <td>{staff.find(x=>x.id===r.staff_id)?.name||'—'}</td><td>{branches.find(x=>x.id===r.branch_id)?.name||'—'}</td>
    <td>{r.photo_path?<a href={String(r.photo_path).startsWith('/assets/demo/')?String(r.photo_path):'/api/points/evidence?id='+encodeURIComponent(r.id)} target="_blank" rel="noreferrer"><img alt="Ver ticket completo" src={String(r.photo_path).startsWith('/assets/demo/')?String(r.photo_path):'/api/points/evidence?id='+encodeURIComponent(r.id)} width="52" height="52" style={{objectFit:'cover',borderRadius:8}}/></a>:'—'}</td>
   </tr>)}</tbody></table></div>:<p className="ownerEmpty">No hay canjes que coincidan con estos filtros.</p>}
 </div>;
}
