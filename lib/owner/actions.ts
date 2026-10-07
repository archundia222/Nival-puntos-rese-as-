'use server';
import {revalidatePath} from 'next/cache';
import {query} from '../foundation/db';
import {requireBusiness} from '../foundation/session';
import {guardAction} from '../foundation/action-guard';
import type {Result} from '../foundation/actions';
export async function saveSegments(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),businessId=String(f.get('businessId')||'');await requireBusiness(actor,businessId);
 const names=['new_days','frequent_days','frequent_visits','risk_from','lost_after','risk_visits'];
 const v=names.map(n=>Number(f.get(n))),max=[365,365,100,730,731,100];
 if(v.some((n,i)=>!Number.isInteger(n)||n<1||n>max[i])||v[3]>v[4]||v[4]<2)return {error:'Revisa los umbrales. El inicio de riesgo no puede superar el límite de perdidos.'};
 await query(actor,`insert into nival_pr.segment_settings(business_id,new_days,frequent_days,frequent_visits,risk_from,lost_after,risk_visits) values($1,$2,$3,$4,$5,$6,$7) on conflict(business_id) do update set new_days=excluded.new_days,frequent_days=excluded.frequent_days,frequent_visits=excluded.frequent_visits,risk_from=excluded.risk_from,lost_after=excluded.lost_after,risk_visits=excluded.risk_visits`,[businessId,...v]);
 revalidatePath('/panel');return {success:'Umbrales guardados. Los segmentos se recalcularon.'};
}
