'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {saveGoogleReport} from '../admin/actions';
import {checklistLabels,mexicoToday} from './domain.mjs';
export function GoogleReportForm({businesses}:{businesses:{id:string;name:string}[]}){
 const [kind,setKind]=useState('month');
 return <ActionForm action={saveGoogleReport} label="Guardar reporte de Google">
 <label>Negocio<select name="businessId" required>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 <label>Tipo de periodo<select name="periodKind" value={kind} onChange={e=>setKind(e.target.value)}><option value="day">Día</option><option value="month">Mes</option><option value="year">Año</option></select></label>
 <label>Periodo<input key={kind} name="period" type={kind==='year'?'number':kind==='day'?'date':'month'} min={kind==='year'?2000:undefined} max={kind==='year'?2100:undefined} required defaultValue={mexicoToday().slice(0,kind==='year'?4:kind==='day'?10:7)}/></label>
 <label>Calificación al cierre<input name="rating" type="number" min="1" max="5" step="0.1" required/></label>
 <label>Reseñas totales al cierre<input name="total" type="number" min="0" required/></label>
 <label>Nuevas del periodo<input name="new" type="number" min="0" required/></label>
 <label>Respondidas de las nuevas<input name="answered" type="number" min="0" required/></label>
 {[1,2,3,4,5].map(n=><label key={n}>{n} estrellas · total al cierre<input name={'star'+n} type="number" min="0" required defaultValue={0}/></label>)}
 <p className="wide">La distribución debe sumar el total. Las respuestas se cuentan sobre las reseñas nuevas. Guarda un reporte por periodo; al repetirlo se actualiza.</p>
 {Object.entries(checklistLabels).map(([k,label])=><label key={k} className="wide checkRow"><input type="checkbox" name={'check_'+k}/>{label} · revisado</label>)}
 <label className="wide">Consejos para el dueño<textarea name="notes" maxLength={5000}/></label>
 <label>Fecha de los cambios<input name="changeDate" type="date" defaultValue={mexicoToday()}/></label>
 <label className="wide">Cambios realizados por Nival<textarea name="changes" maxLength={5000}/></label>
 </ActionForm>;
}
