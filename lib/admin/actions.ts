'use server';

import {randomBytes} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {query,systemQuery,transaction,type Actor} from '../foundation/db';
import {requireBusiness,requireRole} from '../foundation/session';
import type {Result} from '../foundation/actions';

const val=(f:FormData,k:string)=>String(f.get(k)||'').trim();
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const states=['registrado','cotizando','pago_pendiente','activo','por_vencer','pausado','cancelado'];
const methods=['efectivo','transferencia','mercado_pago','otro'];
const taskStates=['pendiente','en_progreso','completada','cancelada'];

function cleanError(error:unknown){
 const m=String((error as {message?:string})?.message||'');
 if(/unique|duplicate/i.test(m))return 'Ese registro ya existe.';
 return 'No se pudo completar la operación.';
}
async function audit(actor:Actor,action:string,entity:string,businessId:string|null,data:Record<string,unknown>={}){
 await query(actor,'insert into nival_pr.audit_log(actor_id,action,entity,business_id,data) values($1,$2,$3,$4,$5::jsonb)',[actor.id,action,entity,businessId,JSON.stringify(data)]);
}
async function seedRecurringTasks(actor:Actor,businessId:string){
 await transaction(actor,[
  {text:"insert into nival_pr.tasks(business_id,title,status,due_date,recurrence) select $1,'Responder reseñas','pendiente',(current_date+7),'weekly' where not exists(select 1 from nival_pr.tasks where business_id=$1 and title='Responder reseñas' and status in ('pendiente','en_progreso'))",values:[businessId]},
  {text:"insert into nival_pr.tasks(business_id,title,status,due_date,recurrence) select $1,'Cargar reporte de Google','pendiente',(current_date+interval '1 month')::date,'monthly' where not exists(select 1 from nival_pr.tasks where business_id=$1 and title='Cargar reporte de Google' and status in ('pendiente','en_progreso'))",values:[businessId]},
  {text:"insert into nival_pr.tasks(business_id,title,status,due_date,recurrence) select id,'Cobrar mensualidad','pendiente',(paid_until at time zone 'America/Mexico_City')::date,'monthly' from nival_pr.businesses where id=$1 and paid_until is not null and not exists(select 1 from nival_pr.tasks where business_id=$1 and title='Cobrar mensualidad' and status in ('pendiente','en_progreso'))",values:[businessId]},
  {text:"insert into nival_pr.tasks(business_id,title,status,due_date,recurrence) select $1,'Revisar canjes sospechosos','pendiente',(current_date+7),'weekly' where not exists(select 1 from nival_pr.tasks where business_id=$1 and title='Revisar canjes sospechosos' and status in ('pendiente','en_progreso'))",values:[businessId]},
 ]);
}

export async function changeBusinessStatus(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),status=val(f,'status');
 if(!uuid(businessId)||!states.includes(status))return {error:'Estado inválido.'};
 try{
  const [row]=await query(actor,'update nival_pr.businesses set status=$2 where id=$1 returning id,status',[businessId,status]);
  if(!row)return {error:'Negocio no encontrado.'};
  if(status==='activo')await seedRecurringTasks(actor,businessId);
  revalidatePath('/admin');revalidatePath('/panel');
  return {success:'Estado actualizado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function setBusinessPlan(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),planId=val(f,'planId');
 if(!uuid(businessId)||!uuid(planId))return {error:'Plan inválido.'};
 try{
  const [row]=await query(actor,'update nival_pr.businesses set plan_id=$2 where id=$1 returning id',[businessId,planId]);
  if(!row)return {error:'Negocio no encontrado.'};
  await audit(actor,'business.plan_changed','businesses',businessId,{plan_id:planId});
  revalidatePath('/admin');return {success:'Plan actualizado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function saveBusinessNotes(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),notes=val(f,'notes');
 if(!uuid(businessId)||notes.length>10000)return {error:'Notas inválidas.'};
 try{
  await query(actor,'update nival_pr.businesses set notes=$2 where id=$1',[businessId,notes]);
  await audit(actor,'business.notes_updated','businesses',businessId,{length:notes.length});
  revalidatePath('/admin');return {success:'Notas guardadas.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function registerPayment30(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),amount=Number(val(f,'amount')),method=val(f,'method'),reference=val(f,'reference'),start=val(f,'periodStart');
 if(!uuid(businessId)||!Number.isFinite(amount)||amount<=0||amount>1000000||!methods.includes(method)||(start&&!/^\d{4}-\d{2}-\d{2}$/.test(start)))return {error:'Revisa monto, método y periodo.'};
 try{
  const rows=await transaction(actor,[{text:`with updated as (
    update nival_pr.businesses
    set status='activo',paid_until=greatest(coalesce(paid_until,now()),now())+interval '30 days'
    where id=$1 returning paid_until
   )
   insert into nival_pr.payments(business_id,amount,method,reference,period_start,period_end,registered_by)
   select $1,$2,$3,nullif($4,''),coalesce(nullif($5,'')::date,(now() at time zone 'America/Mexico_City')::date),(u.paid_until at time zone 'America/Mexico_City')::date,$6
   from updated u returning id,period_start,period_end`,values:[businessId,amount,method,reference,start,actor.id]}]);
  const payment=rows[0]?.[0];if(!payment)return {error:'Negocio no encontrado.'};
  await seedRecurringTasks(actor,businessId);
  await audit(actor,'payment.registered','payments',businessId,{amount,method,reference,period_start:payment.period_start,period_end:payment.period_end});
  revalidatePath('/admin');revalidatePath('/panel');
  return {success:`Pago registrado. Vigencia hasta ${String(payment.period_end).slice(0,10)}.`};
 }catch(e){return {error:cleanError(e)}}
}

export async function generateActivationCode(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),hours=Number(val(f,'expiresHours')||'72');
 if(!uuid(businessId)||!Number.isFinite(hours)||hours<1||hours>720)return {error:'Vencimiento inválido.'};
 const code=`NIV-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
 try{
  const [row]=await query(actor,`insert into nival_pr.activation_codes(code,business_id,plan_id,expires_at,created_by)
   select $2,b.id,b.plan_id,now()+($3::text||' hours')::interval,$4 from nival_pr.businesses b where b.id=$1 and b.plan_id is not null
   returning code,expires_at`,[businessId,code,hours,actor.id]);
  if(!row)return {error:'Asigna un plan al negocio antes de generar el código.'};
  await audit(actor,'activation_code.generated','activation_codes',businessId,{code,expires_at:row.expires_at});
  revalidatePath('/admin');return {success:`Código: ${code} · vence ${new Date(row.expires_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}`};
 }catch(e){return {error:cleanError(e)}}
}

export async function redeemActivationCode(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('owner');const businessId=val(f,'businessId'),code=val(f,'code').toUpperCase();
 if(!uuid(businessId)||!/^NIV-[A-F0-9]{4}-[A-F0-9]{4}$/.test(code))return {error:'Código inválido.'};
 await requireBusiness(actor,businessId);
 try{
  const rows=await systemQuery(`with claimed as (
    update nival_pr.activation_codes set used_at=now()
    where code=$1 and business_id=$2 and used_at is null and expires_at>now()
    returning plan_id
   ), activated as (
    update nival_pr.businesses b set status='activo',plan_id=c.plan_id,paid_until=greatest(coalesce(b.paid_until,now()),now())+interval '30 days'
    from claimed c where b.id=$2 returning b.id,b.paid_until
   )
   select * from activated`,[code,businessId]);
  const row=rows[0];if(!row)return {error:'El código no existe, ya fue usado o venció.'};
  await systemQuery('insert into nival_pr.audit_log(actor_id,action,entity,business_id,data) values($1,$2,$3,$4,$5::jsonb)',[actor.id,'activation_code.redeemed','activation_codes',businessId,JSON.stringify({code})]);
  await seedRecurringTasks(actor,businessId);
  revalidatePath('/panel');return {success:'Servicio activado por 30 días.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function createTask(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),title=val(f,'title'),due=val(f,'dueDate'),recurrence=val(f,'recurrence');
 if(!title||title.length>240||(businessId&&!uuid(businessId))||(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))||(recurrence&&!['daily','weekly','monthly'].includes(recurrence)))return {error:'Revisa la tarea.'};
 try{
  const [row]=await query(actor,'insert into nival_pr.tasks(business_id,title,due_date,recurrence) values(nullif($1,\'\')::uuid,$2,nullif($3,\'\')::date,nullif($4,\'\')) returning id',[businessId,title,due,recurrence]);
  await audit(actor,'task.created','tasks',businessId||null,{task_id:row.id,title});
  revalidatePath('/admin');return {success:'Tarea creada.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function moveTask(taskId:string,status:string):Promise<{ok:boolean}>{
 const actor=await requireRole('superadmin');
 if(!uuid(taskId)||!taskStates.includes(status))return {ok:false};
 const [row]=await query(actor,'update nival_pr.tasks set status=$2 where id=$1 returning id,business_id,title,due_date,recurrence',[taskId,status]);
 if(!row)return {ok:false};
 if(status==='completada'&&row.recurrence){
  await query(actor,`insert into nival_pr.tasks(business_id,title,status,due_date,recurrence)
   values($1,$2,'pendiente',case $4 when 'daily' then coalesce($3::date,current_date)+1 when 'weekly' then coalesce($3::date,current_date)+7 else (coalesce($3::date,current_date)+interval '1 month')::date end,$4)`,[row.business_id,row.title,row.due_date,row.recurrence]);
 }
 await audit(actor,'task.status_changed','tasks',row.business_id||null,{task_id:taskId,status,title:row.title});
 revalidatePath('/admin');return {ok:true};
}

export async function saveContentDraft(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const key=val(f,'key'),text=val(f,'value');
 if(!/^[a-z0-9_]{2,80}$/.test(key)||text.length>12000)return {error:'Contenido inválido.'};
 try{
  await query(actor,`insert into nival_pr.site_content(key,value_draft) values($1,jsonb_build_object('text',$2))
   on conflict(key) do update set value_draft=excluded.value_draft`,[key,text]);
  await audit(actor,'site_content.draft_saved','site_content',null,{key});
  revalidatePath('/admin');return {success:'Borrador guardado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function publishContent(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const key=val(f,'key');
 if(!/^[a-z0-9_]{2,80}$/.test(key))return {error:'Clave inválida.'};
 try{
  const [row]=await query(actor,'update nival_pr.site_content set value_published=value_draft,published_at=now() where key=$1 returning key',[key]);
  if(!row)return {error:'Guarda primero un borrador.'};
  await audit(actor,'site_content.published','site_content',null,{key});
  revalidatePath('/');revalidatePath('/admin');
  return {success:'Publicado. La landing ya usa este valor.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function saveGoogleReport(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),period=val(f,'period'),rating=Number(val(f,'rating')),total=Number(val(f,'total')),fresh=Number(val(f,'new')),answered=Number(val(f,'answered')),notes=val(f,'notes'),changes=val(f,'changes');
 if(!uuid(businessId)||!/^\d{4}-\d{2}$/.test(period)||rating<1||rating>5||[total,fresh,answered].some(n=>!Number.isInteger(n)||n<0))return {error:'Revisa las métricas.'};
 const distribution={1:Number(val(f,'star1')||0),2:Number(val(f,'star2')||0),3:Number(val(f,'star3')||0),4:Number(val(f,'star4')||0),5:Number(val(f,'star5')||0)};
 const checklist={horarios:f.get('check_hours')==='on',categoria:f.get('check_category')==='on',fotos:f.get('check_photos')==='on',descripcion:f.get('check_description')==='on'};
 try{
  await transaction(actor,[
   {text:`insert into nival_pr.review_reports(business_id,period,rating,total_reviews,new_reviews,answered,distribution,profile_checklist,notes,created_by)
    values($1,($2||'-01')::date,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10)
    on conflict(business_id,period) do update set rating=excluded.rating,total_reviews=excluded.total_reviews,new_reviews=excluded.new_reviews,answered=excluded.answered,distribution=excluded.distribution,profile_checklist=excluded.profile_checklist,notes=excluded.notes,created_by=excluded.created_by`,values:[businessId,period,rating,total,fresh,answered,JSON.stringify(distribution),JSON.stringify(checklist),notes,actor.id]},
   ...(changes?[{text:'insert into nival_pr.changelog(business_id,description) values($1,$2)',values:[businessId,changes]}]:[])
  ]);
  await audit(actor,'google_report.saved','review_reports',businessId,{period,rating,total,new:fresh,answered});
  revalidatePath('/admin');revalidatePath('/panel');return {success:'Reporte guardado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function createReviewTask(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const businessId=val(f,'businessId'),reviewer=val(f,'reviewer'),text=val(f,'text'),stars=Number(val(f,'stars'));
 if(!uuid(businessId)||!reviewer||reviewer.length>120||text.length>1500||!Number.isInteger(stars)||stars<1||stars>5)return {error:'Revisa la reseña.'};
 const payload='REVIEW:'+JSON.stringify({reviewer,stars,text});
 try{
  const [row]=await query(actor,"insert into nival_pr.tasks(business_id,title,status,due_date) values($1,$2,'pendiente',current_date) returning id",[businessId,payload]);
  await audit(actor,'review.loaded','tasks',businessId,{task_id:row.id,reviewer,stars});
  revalidatePath('/admin');return {success:'Reseña agregada a la bandeja.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function markReviewResponded(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const taskId=val(f,'taskId');
 if(!uuid(taskId))return {error:'Reseña inválida.'};
 try{
  const [row]=await query(actor,"update nival_pr.tasks set status='completada' where id=$1 and title like 'REVIEW:%' returning business_id",[taskId]);
  if(!row)return {error:'Reseña no encontrada.'};
  await audit(actor,'review.marked_answered','tasks',row.business_id,{task_id:taskId});
  revalidatePath('/admin');return {success:'Marcada como respondida.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function upsertShortLink(_:Result,f:FormData):Promise<Result>{
 const actor=await requireRole('superadmin');const code=val(f,'code'),target=val(f,'targetUrl'),businessId=val(f,'businessId');
 if(!/^[A-Za-z0-9_-]{3,64}$/.test(code)||(businessId&&!uuid(businessId)))return {error:'Código inválido.'};
 try{const u=new URL(target);if(u.protocol!=='https:')throw Error('url');}catch{return {error:'La URL debe comenzar con https://'}};
 try{
  await query(actor,`insert into nival_pr.short_links(code,target_url,business_id) values($1,$2,nullif($3,'')::uuid)
   on conflict(code) do update set target_url=excluded.target_url,business_id=excluded.business_id`,[code,target,businessId]);
  await audit(actor,'short_link.saved','short_links',businessId||null,{code,target});
  revalidatePath('/admin');return {success:'Link corto guardado.'};
 }catch(e){return {error:cleanError(e)}}
}
