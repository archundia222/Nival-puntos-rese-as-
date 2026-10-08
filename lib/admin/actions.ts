'use server';

import {validateLegalDraft} from '../foundation/legal.mjs';
import {sha256} from '../foundation/security.mjs';
import {randomBytes} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {query,systemQuery,transaction,authScope,type Actor} from '../foundation/db';
import {requireBusiness} from '../foundation/session';
import {guardAction} from '../foundation/action-guard';
import {encodeReviewInsights} from '../owner/review-insights.mjs';
import {periodRange,validateGoogle,checklistLabels} from '../owner/domain.mjs';
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
async function seedRecurringTasks(_actor:Actor,businessId:string){
 const [context]=await systemQuery('select b.*,p.features from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id where b.id=$1',[businessId]);
 if(!context||context.status==='cancelado'||!context.paid_until)return;
 const reviews=context?.features?.points_only!==true&&['activo','por_vencer'].includes(context?.status)&&Math.max(Date.parse(context?.paid_until||'')||0,Date.parse(context?.trial_ends_at||'')||0)>Date.now();
 const schedule=[['Diagnóstico inicial: cargar reseñas y revisar reporte',0,null],['Revisar reseñas · seguimiento semanal',3,'weekly'],['Generar y aprobar reporte mensual',28,'monthly'],['Cobrar mensualidad',25,'monthly']] as const;
 for(const [title,days,recurrence] of schedule.filter(([title])=>reviews||title==='Cobrar mensualidad'))await systemQuery(`insert into nival_pr.tasks(business_id,title,status,due_date,recurrence) select $1,$2,'pendiente',case when $2='Cobrar mensualidad' then (select (paid_until at time zone 'America/Mexico_City')::date-5 from nival_pr.businesses where id=$1) else (now() at time zone 'America/Mexico_City')::date+$3::int end,$4 where ($2 not like 'Diagnóstico%' or not exists(select 1 from nival_pr.generated_reports where business_id=$1 and kind='diagnosis')) and not exists(select 1 from nival_pr.tasks where business_id=$1 and title=$2 and status in ('pendiente','en_progreso')) on conflict do nothing`,[businessId,title,days,recurrence]);
}

export async function changeBusinessStatus(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const businessId=val(f,'businessId'),status=val(f,'status');
 if(!uuid(businessId)||!states.includes(status))return {error:'Estado inválido.'};
 try{
  const [row]=await query(actor,`update nival_pr.businesses
   set status=$2 where id=$1 and ($2<>'activo' or paid_until>now()) returning id,status,paid_until`,[businessId,status]);
  if(!row)return {error:'Negocio no encontrado.'};
  if(status==='activo')await seedRecurringTasks(actor,businessId);
  revalidatePath('/admin');revalidatePath('/panel');
  return {success:'Estado actualizado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function setBusinessPlan(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const businessId=val(f,'businessId'),planId=val(f,'planId');
 if(!uuid(businessId)||!uuid(planId))return {error:'Plan inválido.'};
 try{
  const [row]=await query(actor,'update nival_pr.businesses set plan_id=$2 where id=$1 returning id',[businessId,planId]);
  if(!row)return {error:'Negocio no encontrado.'};
  await audit(actor,'business.plan_changed','businesses',businessId,{plan_id:planId});
  await seedRecurringTasks(actor,businessId);revalidatePath('/admin');revalidatePath('/panel');revalidatePath('/admin/reportes');return {success:'Plan actualizado. El historial se conserva y los permisos se ajustan al plan contratado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function saveBusinessNotes(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const businessId=val(f,'businessId'),notes=val(f,'notes');
 if(!uuid(businessId)||notes.length>10000)return {error:'Notas inválidas.'};
 try{
  await query(actor,'update nival_pr.businesses set notes=$2 where id=$1',[businessId,notes]);
  await audit(actor,'business.notes_updated','businesses',businessId,{length:notes.length});
  revalidatePath('/admin');return {success:'Notas guardadas.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function registerPayment30(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f),businessId=val(f,'businessId'),amount=Number(val(f,'amount')),method=val(f,'method'),reference=val(f,'reference');
 if(!uuid(businessId)||!Number.isFinite(amount)||amount<=0||amount>1000000||!methods.includes(method))return {error:'Revisa monto y método.'};
 try{
 const rows=await transaction(actor,[{text:`with locked as (select * from nival_pr.businesses where id=$1 for update),updated as (
 update nival_pr.businesses b set status=case when l.status in ('activo','por_vencer') and l.paid_until>now() then 'activo' else 'pago_pendiente' end,
 paid_until=case when l.status in ('activo','por_vencer') and l.paid_until>now() then l.paid_until+interval '30 days' else l.paid_until end
 from locked l where b.id=l.id returning b.id,b.status,b.paid_until)
 insert into nival_pr.payments(business_id,amount,method,reference,period_start,period_end,registered_by)
 select $1,$2,$3,nullif($4,''),case when u.status='activo' then (u.paid_until at time zone 'America/Mexico_City')::date-30 else (now() at time zone 'America/Mexico_City')::date end,case when u.status='activo' then (u.paid_until at time zone 'America/Mexico_City')::date else (now() at time zone 'America/Mexico_City')::date+30 end,$5 from updated u returning id`,values:[businessId,amount,method,reference,actor.id]}]);
 if(!rows[0]?.length)return {error:'Negocio no encontrado.'};
 await audit(actor,'payment.registered','payments',businessId,{amount,method,payment_id:rows[0][0].id});
 revalidatePath('/admin');revalidatePath('/panel');return {success:'Pago registrado. Si es una renovación vigente se agregaron 30 días desde el vencimiento; si requiere activación, genera y entrega su código. Los días comienzan al usarlo.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function generateActivationCode(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const businessId=val(f,'businessId'),hours=Number(val(f,'expiresHours')||'72');
 if(!uuid(businessId)||!Number.isFinite(hours)||hours<1||hours>720)return {error:'Vencimiento inválido.'};
 const code=`NIV-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
 try{
  const [row]=await query(actor,`insert into nival_pr.activation_codes(code,business_id,plan_id,expires_at,created_by,payment_id)
   select $2,b.id,b.plan_id,now()+($3::text||' hours')::interval,$4,p.id from nival_pr.businesses b join lateral (select p.id from nival_pr.payments p where p.business_id=b.id and not exists(select 1 from nival_pr.activation_codes c where c.payment_id=p.id) order by p.paid_at desc limit 1) p on true where b.id=$1 and b.plan_id is not null and b.status='pago_pendiente'
   returning code,expires_at`,[businessId,code,hours,actor.id]);
  if(!row)return {error:'Confirma el pago y asigna un plan. Cada pago puede generar un solo código de activación.'};
  await audit(actor,'activation_code.generated','activation_codes',businessId,{code,expires_at:row.expires_at});
  revalidatePath('/admin');return {success:`Código generado. Vence ${new Date(row.expires_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}. Entrega el código al dueño para que active sus 30 días.`,copyText:code,copyLabel:'Código de activación de este negocio'};
 }catch(e){return {error:cleanError(e)}}
}

export async function redeemActivationCode(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f);const businessId=val(f,'businessId'),code=val(f,'code').toUpperCase();
 if(!uuid(businessId)||!/^NIV-[A-F0-9]{4}-[A-F0-9]{4}$/.test(code))return {error:'Código inválido.'};
 await requireBusiness(actor,businessId);
 try{
  const [attempt]=await query(authScope(actor.id),'select nival_pr_private.claim_pin_attempt($1) accepted',[sha256('activation:'+actor.id)]);
  if(!attempt?.accepted)return {error:'Demasiados intentos. Espera 15 minutos antes de probar otro código.'};
  const rows=await systemQuery(`with claimed as (
    update nival_pr.activation_codes set used_at=now()
    where code=$1 and business_id=$2 and used_at is null and expires_at>now()
    returning plan_id,payment_id
   ), activated as (
    update nival_pr.businesses b set status='activo',plan_id=c.plan_id,service_started_at=now(),paid_until=now()+interval '30 days'
    from claimed c where b.id=$2 returning b.id,b.paid_until
   ), paid_period as (
    update nival_pr.payments p set period_start=(now() at time zone 'America/Mexico_City')::date,period_end=(now() at time zone 'America/Mexico_City')::date+30 from claimed c where p.id=c.payment_id
   )
   select * from activated`,[code,businessId]);
  const row=rows[0];if(!row){
   const [reason]=await systemQuery(`select used_at,expires_at from nival_pr.activation_codes where code=$1 and business_id=$2`,[code,businessId]);
   if(reason?.used_at)return {error:'Este código ya fue utilizado. Si necesitas renovar, solicita un nuevo periodo a Nival.'};
   if(reason?.expires_at&&new Date(reason.expires_at).getTime()<=Date.now())return {error:'Este código venció. Pide a Nival que te entregue uno vigente.'};
   return {error:'Este código no corresponde a tu negocio o está mal escrito. Copia el código completo NIV-XXXX-XXXX y comprueba la cuenta de tu negocio.'};
  }
  await systemQuery('insert into nival_pr.audit_log(actor_id,action,entity,business_id,data) values($1,$2,$3,$4,$5::jsonb)',[actor.id,'activation_code.redeemed','activation_codes',businessId,JSON.stringify({code})]);
  await seedRecurringTasks(actor,businessId);
  revalidatePath('/panel');return {success:'Servicio activado por 30 días.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function createTask(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const businessId=val(f,'businessId'),title=val(f,'title'),due=val(f,'dueDate'),recurrence=val(f,'recurrence');
 if(!title||title.length>240||(businessId&&!uuid(businessId))||(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))||(recurrence&&!['daily','weekly','monthly'].includes(recurrence)))return {error:'Revisa la tarea.'};
 try{
  const [row]=await query(actor,'insert into nival_pr.tasks(business_id,title,due_date,recurrence) values(nullif($1,\'\')::uuid,$2,nullif($3,\'\')::date,nullif($4,\'\')) returning id',[businessId,title,due,recurrence]);
  await audit(actor,'task.created','tasks',businessId||null,{task_id:row.id,title});
  revalidatePath('/admin');return {success:'Tarea creada.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function moveTask(taskId:string,status:string):Promise<{ok:boolean}>{
 const actor=await guardAction(['superadmin']);
 if(!uuid(taskId)||!taskStates.includes(status))return {ok:false};
 const results=await transaction(actor,[{text:`with changed as (
  update nival_pr.tasks set status=$2 where id=$1 and status<>$2
  returning id,business_id,title,due_date,recurrence
 ), next_task as (
  insert into nival_pr.tasks(business_id,title,status,due_date,recurrence)
  select business_id,title,'pendiente',case recurrence
   when 'daily' then greatest(coalesce(due_date,current_date),current_date)+1
   when 'weekly' then greatest(coalesce(due_date,current_date),current_date)+7
   else (greatest(coalesce(due_date,current_date),current_date)+interval '1 month')::date end,recurrence
  from changed c where $2='completada' and recurrence is not null and (title='Cobrar mensualidad' or exists(select 1 from nival_pr.businesses b join nival_pr.plans p on p.id=b.plan_id where b.id=c.business_id and b.status in ('activo','por_vencer') and b.paid_until>now() and coalesce((p.features->>'points_only')::boolean,false)=false))
 )
 insert into nival_pr.audit_log(actor_id,action,entity,business_id,data)
 select $3,'task.status_changed','tasks',business_id,jsonb_build_object('task_id',id,'status',$2,'title',title)
 from changed returning id`,values:[taskId,status,actor.id]}]);
 if(!results[0]?.length)return {ok:false};
 revalidatePath('/admin');return {ok:true};
}

export async function saveContentDraft(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const key=val(f,'key'),text=val(f,'value');
 if(!/^[a-z0-9_]{2,80}$/.test(key)||text.length>20000||!validateLegalDraft(key,text))return {error:'Contenido inválido.'};
 try{
  await query(actor,`insert into nival_pr.site_content(key,value_draft) values($1,jsonb_build_object('text',$2::text))
   on conflict(key) do update set value_draft=excluded.value_draft`,[key,text]);
  await audit(actor,'site_content.draft_saved','site_content',null,{key});
  revalidatePath('/admin');return {success:'Borrador guardado.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function publishContent(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const key=val(f,'key');
 if(!/^[a-z0-9_]{2,80}$/.test(key))return {error:'Clave inválida.'};
 try{
  const [row]=await query(actor,'update nival_pr.site_content set value_published=value_draft,published_at=now() where key=$1 returning key',[key]);
  if(!row)return {error:'Guarda primero un borrador.'};
  await audit(actor,'site_content.published','site_content',null,{key});
  revalidatePath('/');revalidatePath('/admin');revalidatePath('/terminos');revalidatePath('/privacidad');
  return {success:'Publicado. La página correspondiente ya usa este valor.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function saveGoogleReport(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);
 const businessId=val(f,'businessId'),kind=val(f,'periodKind')||'month',inputPeriod=val(f,'period'),range=periodRange(kind,inputPeriod);
 const rating=Number(val(f,'rating')),total=Number(val(f,'total')),fresh=Number(val(f,'new')),answered=Number(val(f,'answered')),notes=val(f,'notes'),changes=val(f,'changes');
 if(!uuid(businessId)||range.kind!==kind||range.key!==inputPeriod||notes.length>5000||changes.length>5000)return {error:'Revisa el negocio, el periodo y la longitud de los textos.'};
 const distribution=Object.fromEntries([1,2,3,4,5].map(n=>[n,Number(val(f,'star'+n))]));
 const error=validateGoogle({rating,total,fresh,answered,distribution});if(error)return {error};
 const insights=encodeReviewInsights(f,total);if(insights.error)return {error:insights.error};
 const checklist=Object.fromEntries(Object.keys(checklistLabels).map(k=>[k,f.get('check_'+k)==='on']));
 try{
 await transaction(actor,[{text:`insert into nival_pr.review_reports(business_id,period,period_kind,rating,total_reviews,new_reviews,answered,distribution,profile_checklist,notes,created_by,answered_scope)
 values($1,$2::date,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,'period')
 on conflict(business_id,period,period_kind) do update set rating=excluded.rating,total_reviews=excluded.total_reviews,new_reviews=excluded.new_reviews,answered=excluded.answered,distribution=excluded.distribution,profile_checklist=excluded.profile_checklist,notes=excluded.notes,created_by=excluded.created_by,answered_scope=excluded.answered_scope`,values:[businessId,range.start,kind,rating,total,fresh,answered,JSON.stringify(distribution),JSON.stringify(checklist),insights.value,actor.id]},
 ...(changes?[{text:"insert into nival_pr.changelog(business_id,date,description) values($1,($2::date::timestamp at time zone 'America/Mexico_City'),$3)",values:[businessId,val(f,'changeDate')||range.today,changes]}]:[])]);
 await audit(actor,'google_report.saved','review_reports',businessId,{period:range.key,kind,rating,total,new:fresh,answered});
 revalidatePath('/admin');revalidatePath('/panel');return {success:'Reporte guardado. Ya está disponible en el panel del dueño.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function createReviewTask(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const businessId=val(f,'businessId'),reviewer=val(f,'reviewer'),text=val(f,'text'),stars=Number(val(f,'stars'));
 if(!uuid(businessId)||!reviewer||reviewer.length>120||text.length>1500||!Number.isInteger(stars)||stars<1||stars>5)return {error:'Revisa la reseña.'};
 const payload='REVIEW:'+JSON.stringify({reviewer,stars,text});
 try{
  const [row]=await query(actor,"insert into nival_pr.tasks(business_id,title,status,due_date) values($1,$2,'pendiente',current_date) returning id",[businessId,payload]);
  await audit(actor,'review.loaded','tasks',businessId,{task_id:row.id,reviewer,stars});
  revalidatePath('/admin');return {success:'Reseña agregada a la bandeja.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function markReviewResponded(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const taskId=val(f,'taskId');
 if(!uuid(taskId))return {error:'Reseña inválida.'};
 try{
  const [row]=await query(actor,"update nival_pr.tasks set status='completada' where id=$1 and title like 'REVIEW:%' returning business_id",[taskId]);
  if(!row)return {error:'Reseña no encontrada.'};
  await audit(actor,'review.marked_answered','tasks',row.business_id,{task_id:taskId});
  revalidatePath('/admin');return {success:'Marcada como respondida.'};
 }catch(e){return {error:cleanError(e)}}
}

export async function upsertShortLink(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f);const code=val(f,'code'),target=val(f,'targetUrl'),businessId=val(f,'businessId');
 if(!/^[A-Za-z0-9_-]{3,64}$/.test(code)||(businessId&&!uuid(businessId)))return {error:'Código inválido.'};
 try{const u=new URL(target);if(u.protocol!=='https:')throw Error('url');}catch{return {error:'La URL debe comenzar con https://'}};
 try{
  await query(actor,`insert into nival_pr.short_links(code,target_url,business_id) values($1,$2,nullif($3,'')::uuid)
   on conflict(code) do update set target_url=excluded.target_url,business_id=excluded.business_id`,[code,target,businessId]);
  await audit(actor,'short_link.saved','short_links',businessId||null,{code,target});
  revalidatePath('/admin');return {success:'Link corto guardado.'};
 }catch(e){return {error:cleanError(e)}}
}
