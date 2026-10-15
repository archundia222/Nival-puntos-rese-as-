import PDFDocument from 'pdfkit';
export async function reportPdf(report:any):Promise<Buffer>{
 const doc=new PDFDocument({size:'A4',margin:48,info:{Title:'Reporte Nival - '+report.business_name,Author:'Nival Tech'}}),chunks:Buffer[]=[];
 const done=new Promise<Buffer>((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const heading=(text:string)=>{doc.moveDown().font('Helvetica-Bold').fontSize(14).fillColor('#164d3b').text(text);doc.moveDown(.4).font('Helvetica').fontSize(10).fillColor('#222222');};
 const line=(s:string)=>doc.text(s,{lineGap:3});const a=report.analysis;
 if(report.kind==='period_summary'){
  const m=a.metrics||{},plan=a.plan||'Puntos';
  doc.font('Helvetica-Bold').fontSize(25).fillColor('#164d3b').text('NIVAL');
  heading(report.business_name);line('Sucursal: '+(report.branch_name||a.branch_name||'Todas las sucursales (consolidado)'));line('Resumen del periodo · Plan '+plan);
  line('Periodo: '+String(report.period_start).slice(0,10)+' al '+String(report.period_end).slice(0,10));
  heading('Impacto del programa de puntos');
  line('Visitas registradas: '+(m.visits||0));line('Puntos otorgados: '+(m.points||0));
  line('Clientes nuevos: '+(m.new_customers||0));line('Clientes que regresaron: '+(m.returning_customers||0));
  line('Premios canjeados: '+(m.redemptions||0));line('Ticket promedio: $'+Number(m.average_ticket||0).toFixed(2)+' MXN');
  line('Ingresos registrados en visitas: $'+Number(m.program_income||0).toFixed(2)+' MXN');
  if(plan!=='Puntos'&&a.reviews){heading('Reseñas de Google');line('Calificación: '+(a.reviews.rating??'Sin dato')+' / 5 · Reseñas totales: '+(a.reviews.total_reviews??'Sin dato'));
   line('Reseñas nuevas: '+(a.reviews.new_reviews??'Sin dato')+' · Respuestas usadas: '+(a.reviews.answered??'Sin dato'));
   if(a.reviews.summary)line('Resumen de reseñas: '+a.reviews.summary);
  }
  if(plan==='Plus'&&a.comparison){heading('Comparación con la zona');line('Negocio: '+a.comparison.business_rating+' / 5 · '+a.comparison.business_reviews+' reseñas');line('Promedio de la zona: '+a.comparison.zone_rating+' / 5 · '+a.comparison.zone_reviews+' reseñas');}
  line('Este resumen refleja los registros disponibles en Nival al cierre del periodo.');doc.end();return done;
 }
 doc.font('Helvetica-Bold').fontSize(25).fillColor('#164d3b').text('NIVAL');heading(report.business_name);line('Sucursal: '+(report.branch_name||a.branch_name||'Todas las sucursales (consolidado)'));
 line(report.kind==='diagnosis'?'Diagnóstico inicial':report.kind==='week'?'Resumen semanal':'Reporte mensual');
 line('Estado: '+(report.status==='approved'?'Aprobado por Nival':'Borrador para revisión'));
 line('Periodo: '+String(report.period_start).slice(0,10)+' al '+String(report.period_end).slice(0,10)+' (fecha final no incluida)');
 heading('Reseñas y reputación');line('Calificación global de Google: '+(report.rating??'Sin dato')+' | Total global de reseñas: '+(report.total_reviews??'Sin dato'));
 line('Cambio en calificación global: '+(a.rating_change??'Sin comparación disponible'));
 line('Reseñas cargadas del periodo: '+a.review_count+' | Respondidas: '+a.answered+' | Pendientes: '+a.unanswered);
 line('Promedio de la muestra: '+(a.sample_average??'Sin muestra')+'. No sustituye la calificación global.');
 const dist=a.distribution||{},n=Number(a.review_count)||0,percent=(stars:number[])=>{const count=stars.reduce((sum,s)=>sum+(Number(dist[s])||0),0);return n?Math.round(count/n*100):0;};
 line('Sentimiento de la muestra cargada: '+percent([4,5])+'% positivas (4–5 estrellas), '+percent([3])+'% neutras y '+percent([1,2])+'% negativas (1–2 estrellas), sobre '+n+' reseñas.');line(a.warning);
 if(a.google_performance){heading('Alcance de Google · captura manual');const p=a.google_performance;line('Impresiones en Búsqueda: '+(p.search_impressions??'Sin dato')+' | Impresiones en Maps: '+(p.maps_impressions??'Sin dato'));line('Llamadas: '+(p.calls??'Sin dato')+' | Clics al sitio web: '+(p.website_clicks??'Sin dato')+' | Cómo llegar: '+(p.direction_requests??'Sin dato'));line('Datos capturados manualmente desde el Perfil de Negocio.');}
 heading('Programa de lealtad');line('Visitas: '+(a.metrics.visits||0)+' | Puntos: '+(a.metrics.points||0)+' | Premios entregados: '+(a.metrics.redemptions||0)+' | Clientes con visitas: '+(a.metrics.visiting_customers||0));
 heading('Qué dicen tus clientes y qué puedes hacer');
 for(const t of a.themes){heading(t.theme);line('Mencionado en '+t.count+' reseñas; '+t.previous_count+' en el periodo anterior cargado. Positivas: '+t.positive+'; negativas: '+t.negative+'.');if(t.keep)line('Mantener: '+t.keep);if(t.improve)line('Mejorar: '+t.improve);for(const r of t.evidence)line('Evidencia - '+r.reviewer+' ('+r.stars+' estrellas, '+String(r.reviewed_on).slice(0,10)+'): '+r.body);}
 if(!a.themes.length)line('No hay suficiente información para identificar temas.');
 heading('Alcance del reporte');line('El reporte usa los datos cargados y los movimientos registrados en Nival. No verifica ventas, no representa reseñas que no se hayan cargado y no garantiza posiciones en Google.');
 doc.end();return done;
}
