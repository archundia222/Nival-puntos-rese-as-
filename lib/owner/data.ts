import {customerPermissions} from './consent.mjs';
import {ownerStatements} from './queries.mjs';
import 'server-only';
import {transaction,query,authScope,type Actor} from '../foundation/db';
import {periodRange,googleSelection} from './domain.mjs';
export async function ownerData(actor:Actor,businessId:string,range:ReturnType<typeof periodRange>,requestedBranchId?:string){
 let branches:Record<string,any>[]=[];
 try{branches=await query(authScope(actor.id),'select * from nival_pr_private.list_branches($1)',[businessId]);}catch{}
 const selectedBranch=branches.find(x=>x.id===requestedBranchId&&x.active)||branches.find(x=>x.is_primary&&x.active)||branches.find(x=>x.active)||null;
 const branchId=selectedBranch?.id;
 try{const scoped=await query(authScope(actor.id),'select * from nival_pr_private.list_branch_settings($1)',[businessId]);for(const br of branches)Object.assign(br,scoped.find((x:Record<string,any>)=>x.branch_id===br.id)||{});}catch{}
 const [settings,segments,metrics,ranking,reports,changes,templates]=await transaction(actor,ownerStatements(businessId,range,branchId));
 const permissions=await customerPermissions((text,values)=>query(actor,text,values),businessId);
 const staff=await query(authScope(actor.id),'select * from nival_pr_private.list_staff($1)',[businessId]);
 let reviewCards:Record<string,any>[]=[];
 try{reviewCards=await query(authScope(actor.id),'select * from nival_pr_private.list_branch_review_cards($1)',[businessId]);}catch{}
 let scopedReports=reports;
 if(branchId){try{const rows=await query(authScope(actor.id),'select * from nival_pr_private.list_branch_review_reports($1,$2,$3::date)',[businessId,branchId,range.end]);if(selectedBranch?.is_primary){if(rows.length)scopedReports=[...reports.filter((old:Record<string,any>)=>!rows.some((item:Record<string,any>)=>String(item.period).slice(0,10)===String(old.period).slice(0,10)&&item.period_kind===old.period_kind)),...rows];}else scopedReports=rows;}catch{if(!selectedBranch?.is_primary)scopedReports=[];}}
 const selected=googleSelection(scopedReports,range);
 const activity=branchId?await query(actor,`with days as (select generate_series($3::date,$4::date-interval '1 day',interval '1 day')::date as activity_date), visits as (select (created_at at time zone 'America/Mexico_City')::date as activity_date,count(*)::int active_users from nival_pr.point_ledger where business_id=$1 and (branch_id=$2 or (branch_id is null and nival_pr.owner_branch_is_primary($1,$2))) and type='visit' and (created_at at time zone 'America/Mexico_City')::date >= $3::date and (created_at at time zone 'America/Mexico_City')::date < $4::date group by 1) select to_char(days.activity_date,'DD Mon') label,coalesce(visits.active_users,0)::int active_users from days left join visits using(activity_date) order by days.activity_date`,[businessId,branchId,range.start,range.end]):[];
 const branchIds=branches.filter(x=>x.active).map(x=>x.id),primaryBranchId=branches.find(x=>x.is_primary&&x.active)?.id;
 const branchActivity=branchIds.length?await query(actor,`select coalesce(branch_id,$2::uuid) branch_id,count(*) filter(where type='visit')::int visits,count(distinct customer_id) filter(where type='visit')::int customers,count(*) filter(where type='redeem')::int redemptions from nival_pr.point_ledger where business_id=$1 and (branch_id=any($3::uuid[]) or branch_id is null) and (created_at at time zone 'America/Mexico_City')::date >= (now() at time zone 'America/Mexico_City')::date-29 group by coalesce(branch_id,$2::uuid)`,[businessId,primaryBranchId,branchIds]):[];
 const branchStats=branches.filter(x=>x.active).map(x=>({...branchActivity.find(s=>s.branch_id===x.id),branch_id:x.id,name:x.name,visits:branchActivity.find(s=>s.branch_id===x.id)?.visits||0,customers:branchActivity.find(s=>s.branch_id===x.id)?.customers||0,redemptions:branchActivity.find(s=>s.branch_id===x.id)?.redemptions||0,staff_count:staff.filter(p=>p.branch_id===x.id&&p.active).length,google_rating:scopedReports.find(p=>p.branch_id===x.id)?.rating??null}));
 const messages=await query(actor,'select segment,body from nival_pr.message_templates where business_id=$1',[businessId]);
 const balances=branchId?await query(actor,"select c.id,coalesce((select sum(l.points)::int from nival_pr.point_ledger l where l.customer_id=c.id and l.business_id=c.business_id and (l.branch_id=$2 or (l.branch_id is null and nival_pr.owner_branch_is_primary($1,$2)))),0) balance,(select count(*)::int from nival_pr.point_ledger l where l.customer_id=c.id and l.business_id=c.business_id and l.type='redeem' and (l.branch_id=$2 or (l.branch_id is null and nival_pr.owner_branch_is_primary($1,$2)))) redemptions,(select r.name from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=c.business_id and r.active order by r.position limit 1) reward_name from nival_pr.customers c where c.business_id=$1",[businessId,branchId]):[];
 const [programRows,rewardRows,paymentRows]=await Promise.all([
  query(actor,'select * from nival_pr.programs where business_id=$1',[businessId]),
  query(actor,'select r.* from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 order by r.position,r.id',[businessId]),
  query(actor,'select amount,method,reference,paid_at,period_start,period_end from nival_pr.payments where business_id=$1 order by paid_at desc limit 20',[businessId]),
 ]);
 let campaignHistory:Record<string,any>[]=[];
 try{campaignHistory=await query(actor,`select s.id,s.segment,s.channel,s.sent_at,cardinality(s.customer_ids) audience_count,
 (select count(*)::int from unnest(s.customer_ids) ids(customer_id) where exists(select 1 from nival_pr.point_ledger l where l.customer_id=ids.customer_id and l.business_id=s.business_id and l.type='visit' and l.created_at>s.sent_at and l.created_at<=s.sent_at+interval '14 days')) returned_count
 from nival_pr.campaign_sends s where s.business_id=$1 order by s.sent_at desc limit 60`,[businessId]);}catch{}
 let recentMovements:Record<string,any>[]=[];
 try{recentMovements=await query(actor,"select l.id,l.type,l.created_at,c.name customer,l.staff_id from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id where l.business_id=$1 and l.type in ('visit','redeem') order by l.created_at desc limit 5",[businessId]);}catch{}
 const redemptions=await query(actor,"select d.id,d.status,d.value_mxn,d.photo_path,r.name reward,c.name customer,l.created_at,l.points,l.staff_id,l.branch_id from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id join nival_pr.customers c on c.id=l.customer_id join nival_pr.rewards r on r.id=d.reward_id where l.business_id=$1 order by l.created_at desc limit 100",[businessId]);
 const [activeRewards]=await query(actor,'select count(*)::int count from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0)',[businessId]);
 const [replyUsage]=await query(actor,`select count(*)::int used from nival_pr.reviews rv join nival_pr.businesses b on b.id=rv.business_id
  where b.id=$1 and rv.published_at>=coalesce(b.service_started_at,b.paid_until-interval '30 days')+greatest(0,floor(extract(epoch from now()-coalesce(b.service_started_at,b.paid_until-interval '30 days'))/2592000))*interval '30 days'
   and rv.published_at<coalesce(b.service_started_at,b.paid_until-interval '30 days')+(greatest(0,floor(extract(epoch from now()-coalesce(b.service_started_at,b.paid_until-interval '30 days'))/2592000))+1)*interval '30 days'`,[businessId]);
 let zoneComparison=null;
 try{[zoneComparison]=await query(actor,'select * from nival_pr.business_comparisons where business_id=$1',[businessId]);}catch{}
 return {campaignHistory,recentMovements,redemptions,staff,activity,messages,settings:settings[0],segments:segments.filter(c=>!branchId||Number(c.visits)>0).map(c=>({...c,...balances.find(p=>p.id===c.id),marketing_consent:permissions.find(p=>p.id===c.id)?.marketing_consent===true})),metrics,ranking:ranking.map((r):Record<string,any>=>({...r,name:staff.find(s=>s.id===r.staff_id)?.name||(r.staff_id===actor.id?actor.name:'Operador anterior')})),activeRewards:activeRewards?.count||0,repliesUsed:replyUsage?.used||0,zoneComparison:zoneComparison?{...zoneComparison,difference:Number(zoneComparison.business_rating)-Number(zoneComparison.zone_average_rating)}:null,branches,branchStats,selectedBranch,reviewCards,assignedReviewCards:reviewCards.filter(c=>c.active).length,program:programRows[0],rewards:rewardRows,payments:paymentRows,...selected,reports:scopedReports,changes,templates};
}
