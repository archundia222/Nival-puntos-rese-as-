'use client';
import {useEffect,useMemo,useState,useTransition} from 'react';
import {moveTask} from '../../lib/admin/actions';

type Task={id:string;title:string;status:string;due_date:string|null;business_name?:string|null;business_id?:string;business_code?:string;business_phone?:string;business_email?:string;recurrence?:string|null};
const columns=[
 {key:'pendiente',label:'Por hacer'},
 {key:'en_progreso',label:'En proceso'},
 {key:'completada',label:'Hecho'},
] as const;

export default function TaskBoard({tasks}:{tasks:Task[]}){
 const [items,setItems]=useState(tasks);const [pending,start]=useTransition();
 useEffect(()=>setItems(tasks),[tasks]);
 const [error,setError]=useState('');
 const grouped=useMemo(()=>Object.fromEntries(columns.map(c=>[c.key,items.filter(t=>t.status===c.key)])),[items]);
 function drop(id:string,status:string){
  if(pending)return;setError('');const previous=items;setItems(v=>v.map(t=>t.id===id?{...t,status}:t));
  start(async()=>{try{const result=await moveTask(id,status);if(!result.ok){setItems(previous);setError('No se pudo mover la tarea.');}}catch{setItems(previous);setError('No se pudo mover la tarea.');}});
 }
 return <><p role="status">{error}</p><div className="kanban" aria-busy={pending}>{columns.map(col=><section className="kanbanCol" key={col.key} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(id)drop(id,col.key)}}>
  <header><strong>{col.label}</strong><span>{grouped[col.key].length}</span></header>
  {grouped[col.key].map(task=><article draggable key={task.id} onDragStart={e=>e.dataTransfer.setData('text/plain',task.id)}>
   <b>{task.title}</b><label>Estado<select aria-label={'Estado de '+task.title} value={task.status} disabled={pending} onChange={e=>drop(task.id,e.target.value)}>{columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
   {task.business_name&&<><small>{task.business_name} · {task.business_code}</small><small>{task.business_phone||'Sin teléfono'} · {task.business_email||'Sin correo'}</small><a href={'/admin/reportes?business='+task.business_id}>Abrir reseñas y reportes</a><a href={'/admin?business='+task.business_id}>Expediente del negocio</a></>}
   <small>{task.due_date?String(task.due_date).slice(0,10):'Sin fecha'}{task.recurrence?` · ${task.recurrence}`:''}</small>
  </article>)}
  {!grouped[col.key].length&&<p className="empty">Sin tareas</p>}
 </section>)}</div></>
}
