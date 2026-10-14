import {customerPermissions} from './consent.mjs';
import {ownerStatements} from './queries.mjs';
import 'server-only';
import {transaction,query,authScope,type Actor} from '../foundation/db';
import {periodRange,googleSelection} from './domain.mjs';
export async function ownerData(actor:Actor,businessId:string,range:ReturnType<typeof periodRange>){
 const [settings,segments,metrics,ranking,reports,changes,templates]=await transaction(actor,ownerStatements(businessId,range));
 const permissions=await customerPermissions((text,values)=>query(actor,text,values),businessId);
 const staff=await query(authScope(actor.id),'select * from nival_pr_private.list_staff($1)',[businessId]);
 let reviewCards:Record<string,any>[]=[];
 try{reviewCards=await query(authScope(actor.id),'select * from nival_pr_private.list_review_cards($1)',[businessId]);}catch{}
 let branches:Record<string,any>[]=[];
 try{branches=await query(authScope(actor.id),'select * from nival_pr_private.list_branches($1)',[businessId]);}catch{}
 const selected=googleSelection(reports,range);
 const activity=await query(actor,`with days as (select generate_series((now() at time zone 'America/Mexico_City')::date-6,(now() at time zone 'America/Mexico_City')::date,interval '1 day')::date as activity_date), visits as (select (created_at at time zone 'America/Mexico_City')::date as activity_date,count(distinct customer_id)::int active_users from nival_pr.point_ledger where business_id=$1 and type='visit' and (created_at at time zone 'America/Mexico_City')::date >= (now() at time zone 'America/Mexico_City')::date-6 group by 1), newcomers as (select (created_at at time zone 'America/Mexico_City')::date as activity_date,count(*)::int new_users from nival_pr.customers where business_id=$1 and (created_at at time zone 'America/Mexico_City')::date >= (now() at time zone 'America/Mexico_City')::date-6 group by 1) select to_char(days.activity_date,'DD Mon') label,coalesce(visits.active_users,0)::int active_users,coalesce(newcomers.new_users,0)::int new_users from days left join visits using(activity_date) left join newcomers using(activity_date) order by days.activity_date`,[businessId]);
 const messages=await query(actor,'select segment,body from nival_pr.message_templates where business_id=$1',[businessId]);
 const balances=await query(actor,"select c.id,nival_pr.point_balance(c.id) balance,(select r.name from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=c.business_id and r.active order by r.position limit 1) reward_name from nival_pr.customers c where c.business_id=$1",[businessId]);
 const [programRows,rewardRows,paymentRows]=await Promise.all([
  query(actor,'select * from nival_pr.programs where business_id=$1',[businessId]),
  query(actor,'select r.* from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 order by r.position,r.id',[businessId]),
  query(actor,'select amount,method,reference,paid_at,period_start,period_end from nival_pr.payments where business_id=$1 order by paid_at desc limit 20',[businessId]),
 ]);
 const [activeRewards]=await query(actor,'select count(*)::int count from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active',[businessId]);
 const [replyUsage]=await query(actor,`select count(*)::int used from nival_pr.reviews rv join nival_pr.businesses b on b.id=rv.business_id
  where b.id=$1 and rv.published_at>=coalesce(b.service_started_at,b.paid_until-interval '30 days')+greatest(0,floor(extract(epoch from now()-coalesce(b.service_started_at,b.paid_until-interval '30 days'))/2592000))*interval '30 days'
   and rv.published_at<coalesce(b.service_started_at,b.paid_until-interval '30 days')+(greatest(0,floor(extract(epoch from now()-coalesce(b.service_started_at,b.paid_until-interval '30 days'))/2592000))+1)*interval '30 days'`,[businessId]);
 let zoneComparison=null;
 try{[zoneComparison]=await query(actor,'select * from nival_pr.business_comparisons where business_id=$1',[businessId]);}catch{}
 return {activity,messages,settings:settings[0],segments:segments.map(c=>({...c,...balances.find(p=>p.id===c.id),marketing_consent:permissions.find(p=>p.id===c.id)?.marketing_consent===true})),metrics,ranking:ranking.map((r):Record<string,any>=>({...r,name:staff.find(s=>s.id===r.staff_id)?.name||(r.staff_id===actor.id?actor.name:'Operador anterior')})),activeRewards:activeRewards?.count||0,repliesUsed:replyUsage?.used||0,zoneComparison:zoneComparison?{...zoneComparison,difference:Number(zoneComparison.business_rating)-Number(zoneComparison.zone_average_rating)}:null,branches,reviewCards,assignedReviewCards:reviewCards.filter(c=>c.active).length,program:programRows[0],rewards:rewardRows,payments:paymentRows,...selected,changes,templates};
}
