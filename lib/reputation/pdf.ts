import PDFDocument from 'pdfkit';
export async function reportPdf(report:any):Promise<Buffer>{
 const doc=new PDFDocument({size:'A4',margin:48,info:{Title:'Reporte Nival - '+report.business_name,Author:'Nival Tech'}}),chunks:Buffer[]=[];
 const done=new Promise<Buffer>((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const heading=(text:string)=>{doc.moveDown().font('Helvetica-Bold').fontSize(14).fillColor('#164d3b').text(text);doc.moveDown(.4).font('Helvetica').fontSize(10).fillColor('#222222');};
 const line=(s:string)=>doc.text(s,{lineGap:3});const a=report.analysis;
 doc.font('Helvetica-Bold').fontSize(25).fillColor('#164d3b').text('NIVAL');heading(report.business_name);
 line(report.kind==='diagnosis'?'Diagnóstico inicial':report.kind==='week'?'Resumen semanal':'Reporte mensual');
 line('Estado: '+(report.status==='approved'?'Aprobado por Nival':'Borrador para revisión'));
 line('Periodo: '+String(report.period_start).slice(0,10)+' al '+String(report.period_end).slice(0,10)+' (fecha final no incluida)');
 heading('Reseñas y reputación');line('Calificación global de Google: '+(report.rating??'Sin dato')+' | Total global de reseñas: '+(report.total_reviews??'Sin dato'));
 line('Cambio en calificación global: '+(a.rating_change??'Sin comparación disponible'));
 line('Reseñas cargadas del periodo: '+a.review_count+' | Respondidas: '+a.answered+' | Pendientes: '+a.unanswered);
 line('Promedio de la muestra: '+(a.sample_average??'Sin muestra')+'. No sustituye la calificación global.');line(a.warning);
 heading('Programa de lealtad');line('Visitas: '+(a.metrics.visits||0)+' | Puntos: '+(a.metrics.points||0)+' | Premios entregados: '+(a.metrics.redemptions||0)+' | Clientes con visitas: '+(a.metrics.visiting_customers||0));
 heading('Qué dicen tus clientes y qué puedes hacer');
 for(const t of a.themes){heading(t.theme);line('Mencionado en '+t.count+' reseñas; '+t.previous_count+' en el periodo anterior cargado. Positivas: '+t.positive+'; negativas: '+t.negative+'.');if(t.keep)line('Mantener: '+t.keep);if(t.improve)line('Mejorar: '+t.improve);for(const r of t.evidence)line('Evidencia - '+r.reviewer+' ('+r.stars+' estrellas, '+String(r.reviewed_on).slice(0,10)+'): '+r.body);}
 if(!a.themes.length)line('No hay suficiente información para identificar temas.');
 heading('Alcance del reporte');line('El reporte usa los datos cargados y los movimientos registrados en Nival. No verifica ventas, no representa reseñas que no se hayan cargado y no garantiza posiciones en Google.');
 doc.end();return done;
}
