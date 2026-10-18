begin;
CREATE OR REPLACE FUNCTION nival_pr_private.customer_card(b uuid, h text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object('id',c.id,'manual_code',c.manual_code,'name',c.name,'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=c.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost,'photo_url',photo_url) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'available_rewards',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'points_cost',r.points_cost,'photo_url',r.photo_url) order by r.position)
 from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id
 where p.business_id=b and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0)
 and r.points_cost <= (select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=c.id)
 and (p.mode <> 'choose' or exists(select 1 from nival_pr.customer_goals g where g.customer_id=c.id and g.reward_id=r.id and g.locked))
 and (nival_pr_private.segment_reward_policy(c.id)->>'scope'<>'segments' or exists(select 1 from jsonb_array_elements_text(coalesce(nival_pr_private.segment_reward_policy(c.id)->'ids','[]'::jsonb)) x(id) where x.id=r.id::text))
 ),'[]'::jsonb),
 'redeemed_rewards',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'photo_url',x.photo_url,'created_at',x.created_at) order by x.created_at desc)
 from (select l.id,r.name,r.photo_url,l.created_at from nival_pr.point_ledger l join nival_pr.rewards r on r.id=l.reward_id
 left join nival_pr.redemptions d on d.ledger_id=l.id
 where l.customer_id=c.id and l.type='redeem' and (d.status is null or d.status<>'revertido')
 order by l.created_at desc limit 30) x),'[]'::jsonb),
 'reward_policy',nival_pr_private.segment_reward_policy(c.id),'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now()
$function$
;
commit;
