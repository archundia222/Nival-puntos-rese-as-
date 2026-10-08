import {customerPermissions} from './consent.mjs';
import {ownerStatements} from './queries.mjs';
import 'server-only';
import {transaction,query,authScope,type Actor} from '../foundation/db';
import {periodRange,googleSelection} from './domain.mjs';
export async function ownerData(actor:Actor,businessId:string,range:ReturnType<typeof periodRange>){
 const [settings,segments,metrics,ranking,reports,changes,templates]=await transaction(actor,ownerStatements(businessId,range));
 const permissions=await customerPermissions((text,values)=>query(actor,text,values),businessId);
 const staff=await query(authScope(actor.id),'select * from nival_pr_private.list_staff($1)',[businessId]);
 const selected=googleSelection(reports,range);
 const messages=await query(actor,'select segment,body from nival_pr.message_templates where business_id=$1',[businessId]);
 const balances=await query(actor,"select c.id,nival_pr.point_balance(c.id) balance,(select r.name from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=c.business_id and r.active order by r.position limit 1) reward_name from nival_pr.customers c where c.business_id=$1",[businessId]);
 return {messages,settings:settings[0],segments:segments.map(c=>({...c,...balances.find(p=>p.id===c.id),marketing_consent:permissions.find(p=>p.id===c.id)?.marketing_consent===true})),metrics,ranking:ranking.map((r):Record<string,any>=>({...r,name:staff.find(s=>s.id===r.staff_id)?.name||(r.staff_id===actor.id?actor.name:'Operador anterior')})),...selected,changes,templates};
}
