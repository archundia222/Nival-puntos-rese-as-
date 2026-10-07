"use server";
import {revalidatePath} from 'next/cache';
import {guardAction} from '../foundation/action-guard';
import {query,transaction} from '../foundation/db';
import {validateReview,replyDraft,analyzeReviews} from './engine.mjs';
import type {Result} from '../foundation/actions';
const value=(f:FormData,k:string)=>String(f.get(k)||'').trim();
function refresh(){revalidatePath('/admin/reportes');revalidatePath('/panel/reportes');revalidatePath('/panel');}
export async function importReviews(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f),b=value(f,'businessId');
 try{
 const raw=JSON.parse(value(f,'reviews'));if(!Array.isArray(raw)||!raw.length||raw.length>200)return {error:'Carga entre 1 y 200 reseñas por lote.'};
 const reviews=raw.map(validateReview);
 const [business]=await query(actor,'select name from nival_pr.businesses where id=$1',[b]);if(!business)return {error:'Negocio no encontrado.'};
 const result=await transaction(actor,reviews.map(r=>({text:`insert into nival_pr.reviews(business_id,reviewer,stars,body,reviewed_on,fingerprint,response_draft) values($1,$2,$3,$4,$5,$6,$7) on conflict(business_id,fingerprint) do nothing returning id`,values:[b,r.reviewer,r.stars,r.body,r.reviewed_on,r.fingerprint,replyDraft(r,business.name)]})));
 const added=result.reduce((n,r)=>n+r.length,0);refresh();return {success:`${added} reseñas registradas; ${reviews.length-added} duplicadas omitidas.`};
 }catch{return {error:'No se pudo importar. Revisa los datos y las fechas antes de guardar.'};}
}
export async function recordPublishedReply(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin']);
 if(f.get('confirmed')!=='on')return {error:'Confirma que publicaste esta respuesta en Google.'};
 try{await query(actor,'select nival_pr.publish_review($1,$2)',[value(f,'reviewId'),value(f,'reply')]);refresh();return {success:'Publicación registrada y descontada del cupo actual.'};}
 catch(e){const m=String((e as Error).message);return {error:/Cupo agotado|Servicio no activo|ya respondida|Plan sin cupo/.test(m)?m:'No se pudo registrar la publicación.'};}
}
export async function generateReport(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f),b=value(f,'businessId'),kind=value(f,'kind'),start=value(f,'start'),end=value(f,'end');
 const days=(Date.parse(end)-Date.parse(start))/86400000;
 if(!['week','month','diagnosis'].includes(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||!Number.isFinite(days)||days<1||days>100)return {error:'Elige un periodo de 1 a 100 días; la fecha final no se incluye.'};
 const rating=value(f,'rating')?Number(value(f,'rating')):null,total=value(f,'total')?Number(value(f,'total')):null;
 if((rating!==null&&(!Number.isFinite(rating)||rating<1||rating>5))||(total!==null&&(!Number.isInteger(total)||total<0)))return {error:'Revisa las cifras actuales de Google.'};
 try{
 const reviews=await query(actor,`select *,to_char(reviewed_on,'YYYY-MM-DD') reviewed_on from nival_pr.reviews where business_id=$1 and reviewed_on>=$2::date and reviewed_on<$3::date order by reviewed_on`,[b,start,end]);
 const previous=await query(actor,`select * from nival_pr.reviews where business_id=$1 and reviewed_on>=$2::date-($3::date-$2::date) and reviewed_on<$2::date`,[b,start,end]);
 if(total!==null&&total<reviews.length)return {error:'El total de Google no puede ser menor que las reseñas del periodo.'};
 const [metrics]=await query(actor,`select count(*) filter(where l.type='visit')::int visits,coalesce(sum(l.points) filter(where l.type='visit'),0)::int points,count(*) filter(where l.type='redeem' and d.status<>'revertido')::int redemptions,count(distinct l.customer_id) filter(where l.type='visit')::int visiting_customers from nival_pr.point_ledger l left join nival_pr.redemptions d on d.ledger_id=l.id where l.business_id=$1 and (l.created_at at time zone 'America/Mexico_City')::date>=$2::date and (l.created_at at time zone 'America/Mexico_City')::date<$3::date`,[b,start,end]);
 const analysis=analyzeReviews(reviews,previous,metrics);
 const [baseline]=await query(actor,"select rating,total_reviews,kind from nival_pr.generated_reports where business_id=$1 and status='approved' and period_end<=$2::date order by period_end desc,created_at desc limit 1",[b,start]);
 analysis.previous_global=baseline||null;analysis.rating_change=rating!==null&&baseline?.rating!==null&&baseline?.rating!==undefined?Math.round((rating-Number(baseline.rating))*10)/10:null;const [r]=await query(actor,`insert into nival_pr.generated_reports(business_id,kind,period_start,period_end,rating,total_reviews,analysis,created_by) values($1,$2,$3,$4,$5,$6,$7::jsonb,$8) returning id`,[b,kind,start,end,rating,total,JSON.stringify(analysis),actor.id]);
 refresh();return {success:'Borrador generado. Revísalo antes de aprobarlo.',link:'/admin/reportes?business='+b+'&report='+r.id};
 }catch{return {error:'No se pudo generar el reporte. Los datos registrados se conservan.'};}
}
export async function approveReport(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin']);
 if(f.get('confirmed')!=='on')return {error:'Confirma que revisaste las cifras, los temas y las recomendaciones.'};
 try{const [r]=await query(actor,"update nival_pr.generated_reports set status='approved',approved_at=now() where id=$1 and status='draft' returning business_id",[value(f,'reportId')]);if(!r)return {error:'Reporte no encontrado o ya aprobado.'};refresh();return {success:'Reporte aprobado. Ya puede consultarlo el dueño.'};}catch{return {error:'No se pudo aprobar.'};}
}
export async function recordReportSent(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin']);
 try{const [r]=await query(actor,"update nival_pr.generated_reports set sent_at=now() where id=$1 and status='approved' and sent_at is null returning id",[value(f,'reportId')]);if(!r)return {error:'Aprueba el reporte antes de registrar el envío.'};refresh();return {success:'Envío registrado.'};}catch{return {error:'No se pudo registrar el envío.'};}
}

export async function editImportedReview(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin']);
 try{const r=validateReview({reviewer:value(f,'reviewer'),stars:value(f,'stars'),body:value(f,'body'),reviewed_on:value(f,'reviewed_on')});
 const [row]=await query(actor,'update nival_pr.reviews set reviewer=$2,stars=$3,body=$4,reviewed_on=$5,fingerprint=$6 where id=$1 returning id',[value(f,'reviewId'),r.reviewer,r.stars,r.body,r.reviewed_on,r.fingerprint]);
 if(!row)return {error:'Reseña no encontrada.'};refresh();return {success:'Datos corregidos. Genera otro borrador para reflejar los cambios en el reporte.'};}catch{return {error:'Revisa autor, estrellas y fecha. No se puede duplicar otra reseña registrada.'};}
}
