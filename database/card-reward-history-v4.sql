begin;

create or replace function nival_pr_private.reward_unlock_time(c uuid, reward_cost integer)
returns timestamptz language sql stable security definer set search_path='' as $unlock$
with running as (
 select l.created_at,l.id,sum(l.points) over(order by l.created_at,l.id) as balance
 from nival_pr.point_ledger l where l.customer_id=c
), crossings as (
 select created_at,balance,coalesce(lag(balance) over(order by created_at,id),0) as previous_balance from running
)
select max(created_at) from crossings where balance>=reward_cost and previous_balance<reward_cost
$unlock$;

create or replace function nival_pr_private.reward_is_redeemable(c uuid, r uuid)
returns boolean language plpgsql stable security definer set search_path='' as $redeemable$
declare points_balance bigint; goal integer; business uuid; expiry jsonb; unlock_at timestamptz;
 mode text; expiry_value integer; expiry_unit text;
begin
 select rw.points_cost, p.business_id, p.rules->'card_design'
 into goal,business,expiry from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id
 join nival_pr.customers cu on cu.business_id=p.business_id
 where rw.id=r and cu.id=c and rw.active
 and (rw.expires_at is null or rw.expires_at>now())
 and (rw.stock is null or rw.stock>0);
 if goal is null then return false; end if;
 select coalesce(sum(l.points),0) into points_balance from nival_pr.point_ledger l where l.customer_id=c;
 if points_balance<goal then return false; end if;
 mode:=coalesce(expiry->>'rewardExpiryMode','none');
 if mode not in ('duration','same_visit') then return true; end if;
 unlock_at:=nival_pr_private.reward_unlock_time(c,goal);
 if unlock_at is null then return false; end if;
 if mode='same_visit' then
   return (unlock_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date
   and exists(select 1 from nival_pr.point_ledger l where l.customer_id=c and l.type='visit'
   and (l.created_at at time zone 'America/Mexico_City')::date=(unlock_at at time zone 'America/Mexico_City')::date);
 end if;
 expiry_value:=least(365,greatest(1,coalesce(nullif(expiry->>'rewardExpiryValue','')::int,1)));
 expiry_unit:=coalesce(expiry->>'rewardExpiryUnit','months');
 if expiry_unit='days' then return now()<unlock_at+make_interval(days=>expiry_value);
 elsif expiry_unit='weeks' then return now()<unlock_at+make_interval(weeks=>expiry_value);
 else return now()<unlock_at+make_interval(months=>expiry_value);end if;
end $redeemable$;

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
 and nival_pr_private.reward_is_redeemable(c.id,r.id)
 and (case when nival_pr_private.segment_reward_policy(c.id)->>'scope'='segments'
 then nival_pr_private.segment_reward_policy(c.id)->>'mode'<>'choose' or exists(select 1 from nival_pr.customer_goals g where g.customer_id=c.id and g.reward_id=r.id and g.locked)
 else p.mode<>'choose' or exists(select 1 from nival_pr.customer_goals g where g.customer_id=c.id and g.reward_id=r.id and g.locked) end)
 and (nival_pr_private.segment_reward_policy(c.id)->>'scope'<>'segments' or exists(select 1 from jsonb_array_elements_text(coalesce(nival_pr_private.segment_reward_policy(c.id)->'ids','[]'::jsonb)) x(id) where x.id=r.id::text))
 ),'[]'::jsonb),
 'redeemed_rewards',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'photo_url',x.photo_url,'created_at',x.created_at) order by x.created_at desc)
 from (select l.id,r.name,r.photo_url,l.created_at from nival_pr.point_ledger l join nival_pr.rewards r on r.id=l.reward_id
 left join nival_pr.redemptions d on d.ledger_id=l.id
 where l.customer_id=c.id and l.type='redeem' and (d.status is null or d.status<>'revertido')
 order by l.created_at desc limit 30) x),'[]'::jsonb),
 'reward_redeemable',coalesce(nival_pr_private.reward_is_redeemable(c.id,nival_pr_private.next_reward(c.id)),false), 'reward_policy',nival_pr_private.segment_reward_policy(c.id),'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now()
$function$
;
revoke all on function nival_pr_private.reward_unlock_time(uuid,integer) from public;
revoke all on function nival_pr_private.reward_is_redeemable(uuid,uuid) from public;
grant execute on function nival_pr_private.reward_is_redeemable(uuid,uuid) to npr_v2_auth;
commit;
