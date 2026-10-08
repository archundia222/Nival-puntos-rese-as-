"use client";
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {importReviews} from './actions';
import {offsetDateInMexico} from '../mexico-date';
type Row={reviewer:string;stars:string;body:string;reviewed_on:string};
const empty=():Row=>({reviewer:'',stars:'',body:'',reviewed_on:''});
export function ReviewImporter({businessId}:{businessId:string}){
 const [rows,setRows]=useState<Row[]>([empty()]),[text,setText]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 function prepare(input:string){
 try{const json=JSON.parse(input);if(Array.isArray(json)){setRows(json.slice(0,200).map(r=>({reviewer:String(r.reviewer||r.author||''),stars:String(r.stars||r.rating||''),body:String(r.body||r.text||''),reviewed_on:String(r.reviewed_on||r.date||'')})));setNotice('Revisa autores, estrellas y fechas antes de guardar.');return;}}catch{}
 const chunks=input.split(/\n\s*---+\s*\n/).filter(t=>t.trim());
 setRows(chunks.slice(0,200).map(chunk=>{
 const rating=chunk.match(/(?:([1-5])(?:[.,]0)?\s*(?:estrellas?|stars?)|([★⭐]{1,5}))/i);
 const date=chunk.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
 const author=chunk.match(/(?:autor|nombre|author)\s*:\s*([^\n]+)/i);
 return {reviewer:author?.[1]?.trim()||'',stars:rating?(rating[1]||String(rating[2].length)):'',reviewed_on:date?.[1]||'',body:chunk.trim()};
 }));setNotice('Texto extraído. Completa los datos que no se pudieron identificar; no se guardará hasta tu revisión.');
 }
 async function image(file:File){if(file.size>10*1024*1024){setNotice('La captura debe pesar menos de 10 MB.');return;}if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setNotice('Usa una imagen PNG, JPG o WebP.');return;}setBusy(true);setNotice('Leyendo la captura…');try{const {createWorker}=await import('tesseract.js');const worker=await createWorker('spa+eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',workerBlobURL:false});try{const result=await worker.recognize(file);setText(result.data.text);prepare(result.data.text);}finally{await worker.terminate();}}catch{setNotice('No se pudo leer la imagen. Puedes pegar el texto de las reseñas.');}finally{setBusy(false);}}
 function update(i:number,key:keyof Row,v:string){setRows(all=>all.map((r,n)=>n===i?{...r,[key]:v}:r));}
 return <section className="reviewBox"><h2>Cargar reseñas</h2><p>Pega el texto o carga una captura. Separa reseñas con una línea de tres guiones (---). También puedes pegar un arreglo JSON con autor, estrellas, texto y fecha.</p><label>Captura<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void image(f);}}/></label><label>Texto de las reseñas<textarea value={text} onChange={e=>setText(e.target.value)} maxLength={150000}/></label><button type="button" disabled={busy||!text.trim()} onClick={()=>prepare(text)}>Preparar datos para revisión</button><p role="status">{notice}</p>
 <ActionForm action={importReviews} label="Guardar reseñas revisadas"><input type="hidden" name="businessId" value={businessId}/><input type="hidden" name="reviews" value={JSON.stringify(rows)}/><div className="wide">{rows.map((r,i)=><fieldset key={i} style={{marginBottom:16}}><legend>Reseña {i+1}</legend><label>Autor<input required value={r.reviewer} maxLength={120} onChange={e=>update(i,'reviewer',e.target.value)}/></label><label>Estrellas<select required value={r.stars} onChange={e=>update(i,'stars',e.target.value)}><option value="">Confirma las estrellas</option>{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label><label>Fecha de la reseña<input type="date" required value={r.reviewed_on} onChange={e=>update(i,'reviewed_on',e.target.value)}/></label><label>Texto<textarea value={r.body} maxLength={10000} onChange={e=>update(i,'body',e.target.value)}/></label>{rows.length>1&&<button type="button" onClick={()=>setRows(all=>all.filter((_,n)=>n!==i))}>Quitar esta reseña</button>}</fieldset>)}<button type="button" disabled={rows.length>=200} onClick={()=>setRows(r=>[...r,empty()])}>Agregar otra reseña</button></div></ActionForm></section>;
}
export function CopyReply({text}:{text:string}){const [status,setStatus]=useState('');return <><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(text);setStatus('Copiado');}catch{setStatus('Selecciona y copia el texto de la respuesta.');}}}>Copiar borrador</button><span role="status">{status}</span></>;}

export function ReportPeriod(){
 const [kind,setKind]=useState('week'),[end,setEnd]=useState(offsetDateInMexico(1)),[start,setStart]=useState(offsetDateInMexico(-6));
 function change(k:string){setKind(k);const d=new Date(end);if(k==='diagnosis')d.setUTCMonth(d.getUTCMonth()-3);else d.setUTCDate(d.getUTCDate()-(k==='week'?7:30));setStart(d.toISOString().slice(0,10));}
 return <><label>Tipo<select name="kind" value={kind} onChange={e=>change(e.target.value)}><option value="week">Resumen semanal</option><option value="month">Reporte mensual</option><option value="diagnosis">Diagnóstico inicial (últimos tres meses)</option></select></label><label>Desde<input name="start" type="date" required value={start} onChange={e=>setStart(e.target.value)}/></label><label>Hasta (no incluido)<input name="end" type="date" required value={end} onChange={e=>setEnd(e.target.value)}/></label></>;
}
