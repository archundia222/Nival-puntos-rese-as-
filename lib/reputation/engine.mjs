import {createHash} from 'node:crypto';
export const themes=[
 {name:'Atención',pattern:/atenci[oó]n|amable|trato|servicio|personal|meser/i,good:'Mantén el trato del equipo y comparte los comentarios positivos.',action:'Revisa con el equipo los casos de atención señalados y acuerda una mejora concreta.'},
 {name:'Tiempos de espera',pattern:/esper|tard|lento|demora|r[aá]pid/i,good:'Conserva la organización que permite atender a tiempo.',action:'Revisa los tiempos en horas pico y comunica al cliente la espera estimada.'},
 {name:'Producto y calidad',pattern:/sabor|caf[eé]|producto|calidad|fr[ií]o|caliente|delicios|rico|porci[oó]n/i,good:'Mantén la calidad y consistencia de los productos destacados.',action:'Revisa preparación, temperatura y calidad de los productos mencionados.'},
 {name:'Precio y valor',pattern:/precio|caro|barato|costo|cuenta|cobr/i,good:'Mantén claros los precios y lo que incluye cada compra.',action:'Comprueba que precios, porciones y cobros sean claros para el cliente.'},
 {name:'Limpieza y ambiente',pattern:/limpi|suci|higiene|ambiente|ruido|m[uú]sica/i,good:'Conserva las rutinas de limpieza y el ambiente valorado.',action:'Revisa limpieza y ambiente en los horarios mencionados.'}
];
export function validateReview(r){
 const reviewer=String(r.reviewer||'').trim(),body=String(r.body||'').trim(),stars=Number(r.stars),date=String(r.reviewed_on||'');
 if(!reviewer||reviewer.length>120||body.length>10000||!Number.isInteger(stars)||stars<1||stars>5||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))throw Error('Cada reseña necesita autor, estrellas y fecha válida.');
 const fingerprint=createHash('sha256').update(JSON.stringify([reviewer.toLocaleLowerCase('es'),stars,body.toLocaleLowerCase('es').replace(/\s+/g,' '),date])).digest('hex');
 return {reviewer,body,stars,reviewed_on:date,fingerprint};
}
export function replyDraft(r,business){
 if(r.stars<=2)return `Hola ${r.reviewer}, lamentamos que tu experiencia en ${business} no haya sido satisfactoria. Gracias por compartir lo ocurrido. Nos gustaría conocer más detalles por un canal privado del negocio para revisar tu caso.`;
 if(r.stars===3)return `Hola ${r.reviewer}, gracias por compartir tu experiencia en ${business}. Tomaremos en cuenta tus comentarios para revisar qué podemos mejorar. Esperamos poder ofrecerte una mejor experiencia en tu próxima visita.`;
 return `Hola ${r.reviewer}, gracias por tu reseña y por visitar ${business}. Nos alegra que hayas tenido una buena experiencia. Será un gusto recibirte nuevamente.`;
}
export function analyzeReviews(reviews,previous=[],metrics={}){
 const buckets=themes.map(t=>{
 const matching=reviews.filter(r=>t.pattern.test(r.body)),old=previous.filter(r=>t.pattern.test(r.body));
 const polarity=r=>{
 const clauses=r.body.split(/\bpero\b|\baunque\b|[.!;]/i).filter(c=>t.pattern.test(c));
 const good=clauses.some(c=>/amable|excelente|delicios|rico|r[aá]pid|bueno|limpio|encant|agradab/i.test(c));
 const bad=clauses.some(c=>/lento|tard|malo|p[eé]sim|suci|caro|fr[ií]o|decepcion|groser|terrible|esper[aé]/i.test(c));
 return {good:good||(!bad&&r.stars>=4),bad:bad||(!good&&r.stars<=2)};
 };
 const positive=matching.filter(r=>polarity(r).good),negative=matching.filter(r=>polarity(r).bad);
 return {theme:t.name,count:matching.length,previous_count:old.length,positive:positive.length,negative:negative.length,evidence:matching.map(r=>({id:r.id,reviewer:r.reviewer,stars:r.stars,body:r.body,reviewed_on:String(r.reviewed_on).slice(0,10)})),keep:positive.length?t.good:null,improve:negative.length?t.action:null};
 }).filter(t=>t.count>0).sort((a,b)=>b.count-a.count);
 const n=reviews.length;
 return {version:1,review_count:n,answered:reviews.filter(r=>r.published_at).length,unanswered:reviews.filter(r=>!r.published_at).length,sample_average:n?Math.round(reviews.reduce((s,r)=>s+r.stars,0)/n*10)/10:null,distribution:Object.fromEntries([1,2,3,4,5].map(s=>[s,reviews.filter(r=>r.stars===s).length])),themes:buckets,metrics,warning:n<5?'Hay pocas reseñas cargadas. Estos comentarios son señales para revisar, no una tendencia confirmada.':'El análisis usa únicamente las reseñas cargadas. Los temas se detectan por palabras y estrellas; revisa el contexto antes de aprobar.',reviews:reviews.map(r=>({reviewer:r.reviewer,stars:r.stars,body:r.body,reviewed_on:String(r.reviewed_on).slice(0,10)}))};
}
export function serviceWindow(b,now=new Date()){
 const start=new Date(b.service_started_at||new Date(b.paid_until).getTime()-30*86400000);
 if(!Number.isFinite(start.getTime()))return null;
 const index=Math.max(0,Math.floor((now-start)/ (30*86400000)));
 return {start:new Date(start.getTime()+index*30*86400000).toISOString(),end:new Date(start.getTime()+(index+1)*30*86400000).toISOString()};
}
