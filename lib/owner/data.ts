import {ownerStatements} from './queries.mjs';
import 'server-only';
import {transaction,query,authScope,type Actor} from '../foundation/db';
import {periodRange} from './domain.mjs';
export async function ownerData(actor:Actor,businessId:string,range:ReturnType<typeof periodRange>){
 const [settings,segments,metrics,ranking,reports,changes,templates]=await transaction(actor,ownerStatements(businessId,range));
 const staff=await query(authScope(actor.id),'select * from nival_pr_private.list_staff($1)',[businessId]);
 const last=reports.at(-1);
 const inPeriod=reports.filter(r=>String(r.period).slice(0,10)>=range.start);
 const order=range.kind==='year'?['year','month','day']:range.kind==='month'?['month','day']:['day'];
 const resolution=order.find(k=>inPeriod.some(r=>r.period_kind===k));
 const selected=inPeriod.filter(r=>r.period_kind===resolution);
 const google=selected.length?{fresh:selected.reduce((s,r)=>s+Number(r.new_reviews),0),answered:selected.every(r=>r.answered_scope==='period')?selected.reduce((s,r)=>s+Number(r.answered),0):null,resolution}:null;
 return {settings:settings[0],segments,metrics,ranking:ranking.map((r):Record<string,any>=>({...r,name:staff.find(s=>s.id===r.staff_id)?.name||(r.staff_id===actor.id?actor.name:'Operador anterior')})),last,google,changes,templates,reports:inPeriod};
}
