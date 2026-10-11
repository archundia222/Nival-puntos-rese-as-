'use server';
import {requireTool} from '../foundation/require-tool';
import {revalidatePath} from 'next/cache';
import {query} from '../foundation/db';
import {requireBusiness} from '../foundation/session';
import {guardAction} from '../foundation/action-guard';
import type {Result} from '../foundation/actions';
export async function saveSegments(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),businessId=String(f.get('businessId')||'');await requireTool(actor,businessId);
 const names=['new_days','frequent_days','frequent_visits','risk_from','lost_after','risk_visits'];
 const v=names.map(n=>Number(f.get(n))),max=[365,365,100,730,731,100];
 if(v.some((n,i)=>!Number.isInteger(n)||n<1||n>max[i])||v[3]>v[4]||v[4]<2)return {error:'Revisa los umbrales. El inicio de riesgo no puede superar el límite de perdidos.'};
 await query(actor,`insert into nival_pr.segment_settings(business_id,new_days,frequent_days,frequent_visits,risk_from,lost_after,risk_visits) values($1,$2,$3,$4,$5,$6,$7) on conflict(business_id) do update set new_days=excluded.new_days,frequent_days=excluded.frequent_days,frequent_visits=excluded.frequent_visits,risk_from=excluded.risk_from,lost_after=excluded.lost_after,risk_visits=excluded.risk_visits`,[businessId,...v]);
 revalidatePath('/panel');return {success:'Umbrales guardados. Los segmentos se recalcularon.'};
}

export async function saveMessageTemplate(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),businessId=String(f.get('businessId')||''),segment=String(f.get('segment')||''),body=String(f.get('body')||'').trim();
 if(!['new','active','frequent','risk','lost','near_reward'].includes(segment)||!body||body.length>1500)return {error:'Escribe una plantilla de hasta 1500 caracteres.'};
 try{await requireTool(actor,businessId);await query(actor,'insert into nival_pr.message_templates(business_id,segment,body) values($1,$2,$3) on conflict(business_id,segment) do update set body=excluded.body',[businessId,segment,body]);revalidatePath('/panel');return {success:'Plantilla guardada. Revisa cada mensaje antes de enviarlo.'};}catch{return {error:'No se pudo guardar. Comprueba la vigencia de tu plan.'};}
}

export async function manageReviewCard(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),businessId=String(f.get('businessId')||''),code=String(f.get('code')||'').trim()||null,label=String(f.get('label')||'').trim(),active=f.get('active')!=='false';
 if(!/^[0-9a-f-]{36}$/i.test(businessId)||code&&!/^[a-f0-9]{18}$/.test(code)||label.length>80)return {error:'Revisa el nombre de la tarjeta.'};
 try{await requireTool(actor,businessId);await query({role:'auth',id:actor.id},'select nival_pr_private.manage_review_card($1,$2,$3,$4)',[businessId,code,label,active]);revalidatePath('/panel');return {success:code?'Tarjeta QR actualizada.':'Tarjeta QR creada.'};}
 catch(e){const m=String((e as {message?:string})?.message||'');return {error:/Máximo 10/.test(m)?m:/Configura primero/.test(m)?'Agrega la URL de Google en los datos del negocio antes de crear las tarjetas.':'No se pudo actualizar la tarjeta QR.'};}
}

export async function manageBranch(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),businessId=String(f.get('businessId')||''),branchId=String(f.get('branchId')||'').trim()||null,name=String(f.get('name')||'').trim(),active=f.get('active')!=='false';
 if(!/^[0-9a-f-]{36}$/i.test(businessId)||branchId&&!/^[0-9a-f-]{36}$/i.test(branchId)||name.length>120)return {error:'Revisa el nombre de la sucursal.'};
 try{await requireTool(actor,businessId);await query({role:'auth',id:actor.id},'select nival_pr_private.manage_branch($1,$2,$3,$4)',[businessId,branchId,name,active]);revalidatePath('/panel');return {success:branchId?'Sucursal actualizada.':'Sucursal agregada.'};}
 catch(e){const m=String((e as {message?:string})?.message||'');return {error:/Máximo 10/.test(m)?m:'No se pudo guardar la sucursal.'};}
}
