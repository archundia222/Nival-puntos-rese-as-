export function ownerStatements(businessId,range,branchId){
 const selected=Boolean(branchId);
 const ledgerBranch=selected?`and (l.branch_id=$5 or (l.branch_id is null and nival_pr.owner_branch_is_primary($1,$5)))`:'';
 const priorBranch=selected?`and (prior.branch_id=$5 or (prior.branch_id is null and nival_pr.owner_branch_is_primary($1,$5)))`:'';
 const firstBranch=selected?`and (branch_id=$5 or (branch_id is null and nival_pr.owner_branch_is_primary($1,$5)))`:'';
 const segmentFunction=selected?'nival_pr.customer_segments_for_branch($1,$2::date,$3)':'nival_pr.customer_segments($1,$2::date)';
 const segmentValues=selected?[businessId,range.today,branchId]:[businessId,range.today];
 const rankingBranch=selected?'and l.branch_id=$4':'';
 const values=[businessId,range.previous,range.start,range.end,branchId];
 const metricValues=selected?values:values.slice(0,4);
 const rankingValues=selected?[businessId,range.start,range.end,branchId]:[businessId,range.start,range.end];
 return [
 {text:'select * from nival_pr.segment_settings where business_id=$1',values:[businessId]},
 {text:`select s.* from ${segmentFunction} s order by s.visits desc,s.name,s.id`,values:segmentValues},
 {text:`with windows as (select 'current' period,$3::date a,$4::date z union all select 'previous',$2::date,$3::date), firsts as (select customer_id,min(created_at) first_at from nival_pr.point_ledger where business_id=$1 ${firstBranch} and type='visit' group by customer_id)
 select w.period,count(l.id) filter(where l.type='visit')::int visits,coalesce(sum(l.points) filter(where l.type='visit'),0)::int points,
 coalesce(sum(l.ticket_value_mxn) filter(where l.type='visit'),0)::numeric(12,2) ticket_revenue,
 count(l.id) filter(where l.type='redeem' and d.status<>'revertido')::int redeemed,count(l.id) filter(where l.type='redeem' and d.status='pendiente')::int pending,
 (select count(*)::int from firsts f where (f.first_at at time zone 'America/Mexico_City')::date>=w.a and (f.first_at at time zone 'America/Mexico_City')::date<w.z) new_customers,
 count(distinct l.customer_id) filter(where l.type='visit')::int active_customers,
 count(distinct l.customer_id) filter(where l.type='visit' and exists(select 1 from nival_pr.point_ledger prior where prior.business_id=$1 and prior.customer_id=l.customer_id and prior.type='visit' ${priorBranch} and (prior.created_at at time zone 'America/Mexico_City')::date<w.a))::int returning_customers
 from windows w left join nival_pr.point_ledger l on l.business_id=$1 ${ledgerBranch} and (l.created_at at time zone 'America/Mexico_City')::date>=w.a and (l.created_at at time zone 'America/Mexico_City')::date<w.z left join nival_pr.redemptions d on d.ledger_id=l.id group by w.period,w.a,w.z`,values:metricValues},
 {text:`select l.staff_id,count(*) filter(where l.type='visit')::int visits,count(*) filter(where l.type='redeem')::int redemptions,count(*) filter(where l.type='redeem' and d.status='revertido')::int reversed,
 count(*) filter(where l.type='redeem' and d.status='pendiente')::int pending,
 count(distinct l.customer_id) filter(where l.type='visit')::int customers
 from nival_pr.point_ledger l left join nival_pr.redemptions d on d.ledger_id=l.id where l.business_id=$1 ${rankingBranch} and (l.created_at at time zone 'America/Mexico_City')::date>=$2::date and (l.created_at at time zone 'America/Mexico_City')::date<$3::date group by l.staff_id order by visits desc,l.staff_id`,values:rankingValues},
 {text:'select * from nival_pr.review_reports where business_id=$1 and period<$2::date order by period,period_kind',values:[businessId,range.end]},
 {text:"select * from nival_pr.changelog where business_id=$1 and (date at time zone 'America/Mexico_City')::date >=$2::date and (date at time zone 'America/Mexico_City')::date<$3::date order by date desc",values:[businessId,range.start,range.end]},
 {text:'select segment,text from nival_pr.advice_templates order by segment,id'}];
}
