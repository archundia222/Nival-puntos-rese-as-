import 'server-only';
import {systemQuery} from '../foundation/db';

/** Creates one immutable plan-specific PDF snapshot after a paid 30-day period closes. */
export async function closePeriodSummaries(){
 return systemQuery(`
 with periods as (
  select b.id business_id,(b.paid_until at time zone 'America/Mexico_City')::date period_end,
         ((b.paid_until at time zone 'America/Mexico_City')::date-30) period_start,b.name business_name,
         p.price_mxn,scope.branch_id,scope.branch_name,coalesce(p.features->>'review_limit','0')::int review_limit,
         coalesce(p.features->>'points_only','false')::boolean points_only
  from nival_pr.businesses b join nival_pr.plans p on p.id=b.plan_id
  cross join lateral (select br.id branch_id,br.name branch_name from nival_pr.branches br where br.business_id=b.id and br.active union all select null::uuid,'Todas las sucursales'::text) scope
  where b.paid_until is not null and b.paid_until<=now()
    and b.status in ('activo','por_vencer','pausado')
 ), snapshots as (
  select x.*,
   jsonb_build_object(
    'visits',coalesce(m.visits,0),'points',coalesce(m.points,0),
    'redemptions',coalesce(m.redemptions,0),'new_customers',coalesce(m.new_customers,0),
    'average_ticket',coalesce(m.average_ticket,0),'program_income',coalesce(m.program_income,0),
    'returning_customers',coalesce(m.returning_customers,0)
   ) metrics,
   rr.rating,rr.total_reviews,rr.new_reviews,rr.answered,rr.distribution,rr.manual_summary,
   case when x.price_mxn=549 and x.branch_id is null then jsonb_build_object(
    'business_rating',bc.business_rating,'business_reviews',bc.business_reviews,
    'zone_rating',bc.zone_average_rating,'zone_reviews',bc.zone_average_reviews
   ) end comparison
  from periods x
  left join lateral (
   select count(*) filter(where l.type='visit')::int visits,
    coalesce(sum(l.points) filter(where l.type='visit'),0)::int points,
    count(*) filter(where l.type='redeem')::int redemptions,
    count(distinct l.customer_id) filter(where l.type='visit')::int visiting_customers,
    coalesce(avg(l.ticket_value_mxn) filter(where l.type='visit' and l.ticket_value_mxn is not null),0)::numeric(12,2) average_ticket,
    coalesce(sum(l.ticket_value_mxn) filter(where l.type='visit'),0)::numeric(12,2) program_income,
    count(distinct l.customer_id) filter(where l.type='visit' and exists(
      select 1 from nival_pr.point_ledger older where older.business_id=x.business_id
       and older.customer_id=l.customer_id and older.type='visit'
       and (x.branch_id is null or older.branch_id=x.branch_id)
       and older.created_at<l.created_at
    ))::int returning_customers,
    (case when x.branch_id is null then
      (select count(*)::int from nival_pr.customers c where c.business_id=x.business_id
       and c.created_at>=(x.period_start::timestamp at time zone 'America/Mexico_City')
       and c.created_at<((x.period_end+1)::timestamp at time zone 'America/Mexico_City'))
     else
      (select count(distinct v.customer_id)::int from nival_pr.point_ledger v
       where v.business_id=x.business_id and v.branch_id=x.branch_id and v.type='visit'
       and v.created_at>=(x.period_start::timestamp at time zone 'America/Mexico_City')
       and v.created_at<((x.period_end+1)::timestamp at time zone 'America/Mexico_City')
       and not exists(select 1 from nival_pr.point_ledger older where older.business_id=v.business_id
        and older.branch_id=v.branch_id and older.customer_id=v.customer_id and older.type='visit'
        and older.created_at<(x.period_start::timestamp at time zone 'America/Mexico_City')))
     end) new_customers
   from nival_pr.point_ledger l where l.business_id=x.business_id and (x.branch_id is null or l.branch_id=x.branch_id)
    and l.created_at>=(x.period_start::timestamp at time zone 'America/Mexico_City')
    and l.created_at<((x.period_end+1)::timestamp at time zone 'America/Mexico_City')
  ) m on true
  left join lateral (select * from (select rating,total_reviews,new_reviews,answered,distribution,manual_summary,period from nival_pr.branch_review_reports r where x.branch_id is not null and r.business_id=x.business_id and r.branch_id=x.branch_id union all select rating,total_reviews,new_reviews,answered,distribution,manual_summary,period from nival_pr.review_reports r where x.branch_id is null and r.business_id=x.business_id) r
    where r.period between x.period_start and x.period_end order by r.period desc limit 1) rr
    on x.review_limit>0 and not x.points_only
  left join nival_pr.business_comparisons bc on bc.business_id=x.business_id and x.price_mxn=549 and x.branch_id is null
 )
 insert into nival_pr.generated_reports(business_id,branch_id,kind,period_start,period_end,rating,total_reviews,analysis,status,created_by,approved_at)
 select s.business_id,s.branch_id,'period_summary',s.period_start,s.period_end,s.rating,s.total_reviews,
  jsonb_build_object('plan',case when s.price_mxn=549 then 'Plus' when s.price_mxn=399 then 'Esencial' else 'Puntos' end,'branch_name',s.branch_name,
   'metrics',s.metrics,
   'reviews',case when s.review_limit>0 and not s.points_only and s.rating is not null then
    jsonb_build_object('rating',s.rating,'total_reviews',s.total_reviews,'new_reviews',s.new_reviews,
     'answered',s.answered,'distribution',coalesce(s.distribution,'{}'::jsonb),'summary',s.manual_summary) end,
   'comparison',case when s.price_mxn=549 and s.branch_id is null then s.comparison end),
  'approved',admin.id,now()
 from snapshots s cross join lateral(select id from nival_pr.profiles where role='superadmin' order by id limit 1) admin
 where not exists(select 1 from nival_pr.generated_reports old where old.business_id=s.business_id and old.branch_id is not distinct from s.branch_id
  and old.kind='period_summary' and old.period_start=s.period_start and old.period_end=s.period_end)
 on conflict do nothing returning id,business_id,period_start,period_end
 `);
}
