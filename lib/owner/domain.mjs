export const segmentKeys=['new','frequent','risk','lost','absent'];
export const checklistLabels={fotos:'Fotos recientes',horarios:'Horarios',categoria:'Categorías',descripcion:'Descripción',publicaciones:'Publicaciones',menu:'Menú o servicios',preguntas:'Preguntas y respuestas',reservas:'Enlace de reservas'};
export function mexicoToday(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function periodRange(kind='month',value='',now=new Date()){
 if(!['day','month','year'].includes(kind))kind='month';
 const today=mexicoToday(now); let key=value||today.slice(0,kind==='day'?10:kind==='year'?4:7);
 if(!(kind==='day'?/^\d{4}-\d{2}-\d{2}$/:kind==='month'?/^\d{4}-\d{2}$/:/^\d{4}$/).test(key))key=today.slice(0,kind==='day'?10:kind==='year'?4:7);
 let start=key+(kind==='month'?'-01':kind==='year'?'-01-01':'');let d=new Date(start+'T12:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==start)return periodRange(kind,'',now);
 const end=new Date(d),previous=new Date(d);
 if(kind==='day'){end.setUTCDate(end.getUTCDate()+1);previous.setUTCDate(previous.getUTCDate()-1);}
 if(kind==='month'){end.setUTCMonth(end.getUTCMonth()+1);previous.setUTCMonth(previous.getUTCMonth()-1);}
 if(kind==='year'){end.setUTCFullYear(end.getUTCFullYear()+1);previous.setUTCFullYear(previous.getUTCFullYear()-1);}
 return {kind,key,start,end:end.toISOString().slice(0,10),previous:previous.toISOString().slice(0,10),today};
}

export function inclusivePeriodEnd(exclusiveEnd){
 const date=new Date(exclusiveEnd+'T12:00:00Z');
 if(!Number.isFinite(date.getTime()))return exclusiveEnd;
 date.setUTCDate(date.getUTCDate()-1);
 return date.toISOString().slice(0,10);
}
export function formatPeriodDate(value){
 const date=new Date(value+'T12:00:00Z');
 if(!Number.isFinite(date.getTime()))return value;
 return new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date);
}
export async function generateAdvice(segment,businessContext){
 const templates=businessContext.templates.filter(t=>t.segment===segment);
 const chosen=templates[businessContext.variant%Math.max(templates.length,1)];
 return chosen?chosen.text.replaceAll('{n}',String(businessContext.count)):'Todavía no hay un consejo disponible para este segmento.';
}
export function validateGoogle(input){
 const {rating,total,fresh,answered,distribution}=input;
 if(!Number.isFinite(rating)||rating<1||rating>5||[total,fresh,answered,...Object.values(distribution)].some(n=>!Number.isSafeInteger(n)||n<0)||fresh>total||answered>fresh)return 'Revisa los totales. Respondidas debe ser menor o igual a nuevas del periodo.';
 if(Object.values(distribution).reduce((s,n)=>s+n,0)!==total)return 'La suma de estrellas debe coincidir con el total de reseñas.';
 return null;
}
export function dateKey(value){return value instanceof Date?value.toISOString().slice(0,10):String(value).slice(0,10);}
export function googleSelection(reports,range){
 const available=reports.map(r=>({...r,period:dateKey(r.period)})).filter(r=>r.period<range.end).sort((a,b)=>a.period.localeCompare(b.period)||({year:0,month:1,day:2}[a.period_kind]-{year:0,month:1,day:2}[b.period_kind]));
 const inPeriod=available.filter(r=>r.period>=range.start);
 const order=range.kind==='year'?['year','month','day']:range.kind==='month'?['month','day']:['day'];
 const resolution=order.find(k=>inPeriod.some(r=>r.period_kind===k));
 const selected=inPeriod.filter(r=>r.period_kind===resolution);
 return {last:available.at(-1)||null,reports:inPeriod,google:selected.length?{fresh:selected.reduce((s,r)=>s+Number(r.new_reviews),0),answered:selected.every(r=>r.answered_scope==='period')?selected.reduce((s,r)=>s+Number(r.answered),0):null,resolution}:null};
}
