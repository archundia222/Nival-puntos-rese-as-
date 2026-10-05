import {ownerStatements} from './queries.mjs';
import 'server-only';
import {transaction,query,authScope,type Actor} from '../foundation/db';
import {periodRange,googleSelection} from './domain.mjs';
export async function ownerData(actor:Actor,businessId:string,range:ReturnType<typeof periodRange>){
 const [settings,segments,metrics,ranking,reports,changes,templates]=await transaction(actor,ownerStatements(businessId,range));
 const staff=await query(authScope(actor.id),'select * from nival_pr_private.list_staff($1)',[businessId]);
 const selected=googleSelection(reports,range);
 return {settings:settings[0],segments,metrics,ranking:ranking.map((r):Record<string,any>=>({...r,name:staff.find(s=>s.id===r.staff_id)?.name||(r.staff_id===actor.id?actor.name:'Operador anterior')})),...selected,changes,templates};
}
