'use client';
import {useState} from 'react';
type Movement=Record<string,any>;
export function CustomerMovementHistory({items}:{items:Movement[]}){
 const [page,setPage]=useState(1);
 const pages=Math.max(1,Math.ceil(items.length/10));
 const current=Math.min(page,pages);
 return <><div className="customerMovementList">{items.slice((current-1)*10,current*10).map(m=><article key={m.id} className="customerRow"><div className="customerMovementHead"><strong>{m.type==='visit'?'Visita':m.type==='redeem'?'Canje':'Ajuste'} · {Number(m.points)>0?'+':''}{m.points} puntos</strong><time>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</time></div>{m.reward&&<p>Premio: {m.reward}</p>}{m.note&&<p>Motivo: {m.note}</p>}<small>Sucursal: {m.branch_name||'—'} · Empleado: {m.staff_name||'—'}</small>{m.redemption_id&&m.photo_path&&<a href={'/api/points/evidence?id='+m.redemption_id} target="_blank" rel="noreferrer">Ver comprobante del canje</a>}</article>)}</div>{items.length>10&&<nav className="nivalPagination" aria-label="Páginas del historial"><button type="button" disabled={current===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>Anterior</button>{Array.from({length:pages},(_,i)=><button type="button" key={i} aria-current={current===i+1?'page':undefined} onClick={()=>setPage(i+1)}>{i+1}</button>)}<button type="button" disabled={current===pages} onClick={()=>setPage(x=>Math.min(pages,x+1))}>Siguiente</button></nav>}</>;
}
