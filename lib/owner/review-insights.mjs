const prefix='NIVAL_REVIEW_INSIGHTS_V1:';
export function encodeReviewInsights(form,total){
 const text=key=>String(form.get(key)||'').trim();
 const notes=text('notes'),improve=text('improve'),keep=text('keep');
 const themes=kind=>Array.from({length:3},(_,i)=>({theme:text(`${kind}Theme${i}`),count:Number(text(`${kind}Count${i}`))}));
 const positive=themes('positive'),negative=themes('negative');
 const used=improve||keep||positive.some(x=>x.theme||x.count)||negative.some(x=>x.theme||x.count)||text('analyzed');
 if(!used)return {value:notes};
 const analyzed=Number(text('analyzed'));
 if(!Number.isInteger(analyzed)||analyzed<1||analyzed>total)return {error:'Indica cuántas reseñas analizaste: entre 1 y el total al cierre.'};
 if(notes.length>5000||improve.length>2000||keep.length>2000)return {error:'Reduce la longitud del análisis y las recomendaciones.'};
 for(const t of [...positive,...negative])if(t.theme.length>160||!Number.isInteger(t.count)||t.count<0||t.count>analyzed||(t.theme&&!t.count)||(!t.theme&&t.count))return {error:'Cada tema necesita un nombre y una frecuencia entre 1 y las reseñas analizadas.'};
 const order=items=>items.filter(x=>x.theme).sort((a,b)=>b.count-a.count);
 return {value:prefix+JSON.stringify({version:1,notes,analyzed,positive:order(positive),negative:order(negative),improve,keep})};
}
export function decodeReviewInsights(value){
 const notes=String(value||'');
 if(!notes.startsWith(prefix))return {notes,analysis:null};
 try{const a=JSON.parse(notes.slice(prefix.length));
 if(a.version!==1||!Number.isInteger(a.analyzed)||a.analyzed<1||!Array.isArray(a.positive)||!Array.isArray(a.negative)||[...a.positive,...a.negative].some(t=>typeof t.theme!=='string'||!Number.isInteger(t.count)||t.count<1||t.count>a.analyzed))throw Error('invalid');
 return {notes:String(a.notes||''),analysis:a};
 }catch{return {notes:'El análisis de este reporte necesita revisión por Nival.',analysis:null};}
}
