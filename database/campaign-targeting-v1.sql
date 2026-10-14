begin;

-- Use the owner's saved audience assignment when selecting a single campaign
-- reward. Once selected, keep the customer on that reward until redemption.
create or replace function nival_pr_private.next_reward(c uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path=''
as $$
declare
  p nival_pr.programs;
  r uuid;
  audience text := 'all';
  candidates jsonb;
  visits_30 integer := 0;
  visits_total integer := 0;
  last_visit timestamptz;
  frequent_days integer := 30;
  frequent_visits integer := 3;
  risk_from integer := 31;
  lost_after integer := 60;
  risk_visits integer := 2;
begin
  perform 1 from nival_pr.customers where id=c for update;
  select pr.* into p
  from nival_pr.programs pr
  join nival_pr.customers cu on cu.business_id=pr.business_id
  where cu.id=c;
  if p.id is null then return null; end if;

  if p.mode='surprise' then
    select g.reward_id into r from nival_pr.customer_goals g where g.customer_id=c and g.locked limit 1;
    if r is not null then return r; end if;
    select g.id into r from nival_pr.rewards g where g.program_id=p.id and g.active order by -ln(greatest(random(),0.00000001))/g.weight limit 1;
    if r is not null then insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true) on conflict(customer_id,reward_id) do update set locked=true; end if;
    return r;
  end if;

  if p.mode='single' and p.rules ? 'campaign_rules' then
    select rw.id into r
      from nival_pr.customer_goals g join nival_pr.rewards rw on rw.id=g.reward_id
      where g.customer_id=c and g.locked and rw.program_id=p.id and rw.active
      limit 1;
    if r is not null then return r; end if;
    select coalesce(max(s.frequent_days),30),coalesce(max(s.frequent_visits),3),
           coalesce(max(s.risk_from),31),coalesce(max(s.lost_after),60),coalesce(max(s.risk_visits),2)
      into frequent_days,frequent_visits,risk_from,lost_after,risk_visits
      from nival_pr.segment_settings s where s.business_id=p.business_id;
    select count(*) filter(where created_at>=now()-make_interval(days=>frequent_days))::int,count(*)::int,max(created_at)
      into visits_30,visits_total,last_visit
      from nival_pr.point_ledger where customer_id=c and type='visit';
    if visits_30>=frequent_visits then audience:='frequent';
    elsif visits_total>=risk_visits and last_visit<=now()-make_interval(days=>risk_from)
      and last_visit>now()-make_interval(days=>lost_after) then audience:='at_risk'; end if;
    candidates:=p.rules#>array['campaign_rules','targets',audience];
    if jsonb_typeof(candidates)<>'array' or jsonb_array_length(candidates)=0 then
      candidates:=p.rules#>'{campaign_rules,targets,all}';
    end if;
    select rw.id into r
      from nival_pr.rewards rw
      where rw.program_id=p.id and rw.active
        and exists(select 1 from jsonb_array_elements_text(coalesce(candidates,'[]'::jsonb)) selected(id) where selected.id=rw.id::text)
      order by case when p.rules#>>'{campaign_rules,strategy}'='random' then random() end, rw.position, rw.id
      limit 1;
    if r is not null then
      insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true)
      on conflict(customer_id,reward_id) do update set locked=true;
      return r;
    end if;
  end if;

  with ordered as (
    select rw.id,row_number() over(order by rw.position,rw.id)-1 idx,count(*) over() total
    from nival_pr.rewards rw where rw.program_id=p.id and rw.active
  ), completed as (
    select count(*) n from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id
    where l.customer_id=c and d.status<>'revertido'
  )
  select o.id into r from ordered o cross join completed x
  where (p.mode='single' and o.idx=0)
     or (p.mode='sequence' and o.idx=x.n%o.total)
     or (p.mode='choose' and exists(select 1 from nival_pr.customer_goals g where g.customer_id=c and g.reward_id=o.id and g.locked))
  limit 1;
  return r;
end $$;

commit;
