begin;

-- Campaign assignments support the same customer groups shown in the owner panel.
create or replace function nival_pr_private.save_branch_campaigns(b uuid,br uuid,rules jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare k text; ids jsonb; total_ids integer;
begin
 perform nival_pr_private.assert_owner(b);
 if not exists(select 1 from nival_pr.branches x where x.id=br and x.business_id=b and x.active)
 then raise exception 'Sucursal no disponible'; end if;
 if jsonb_typeof(rules)<>'object' or rules->>'strategy' not in ('manual','random')
    or jsonb_typeof(rules->'targets')<>'object'
    or exists(select 1 from jsonb_object_keys(rules->'targets') as t(key)
      where t.key not in ('all','new','frequent','at_risk','lost','absent'))
 then raise exception 'Reglas de campaña inválidas'; end if;
 foreach k in array array['all','new','frequent','at_risk','lost','absent'] loop
   ids=coalesce(rules#>array['targets',k],'[]'::jsonb);
   if jsonb_typeof(ids)<>'array' or jsonb_array_length(ids)>10
      or (k='all' and jsonb_array_length(ids)<1) then
    raise exception 'Asigna al menos un premio a Todos; los demás grupos son opcionales'; end if;
   select count(*) into total_ids from jsonb_array_elements_text(ids) as t(id)
   where not exists(
    select 1 from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id
    where rw.id::text=t.id and p.business_id=b and rw.active
      and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0));
   if total_ids>0 then raise exception 'Una promoción no está activa o no pertenece al negocio'; end if;
 end loop;
 update nival_pr.branches set campaign_rules=rules where id=br and business_id=b;
 insert into nival_pr.audit_log(actor_id,action,entity,entity_id,business_id,data)
 values(nival_pr.uid(),'branch.campaigns.changed','branches',br,b,jsonb_build_object('strategy',rules->>'strategy'));
end $$;
revoke all on function nival_pr_private.save_branch_campaigns(uuid,uuid,jsonb) from public;
grant execute on function nival_pr_private.save_branch_campaigns(uuid,uuid,jsonb) to npr_v2_auth;

-- New reward selection follows the visible owner segments, with stable priority
-- for customers who qualify for more than one segment. Empty group assignments
-- fall back to the business-wide reward selection.
create or replace function nival_pr_private.next_reward(c uuid)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare
 p nival_pr.programs; r uuid; br uuid; rules jsonb; audience text:='all'; candidates jsonb;
 recent_visits integer:=0; lifetime_visits integer:=0; first_visit date; last_visit date; new_days integer:=14;
 frequent_days integer:=30; frequent_visits integer:=3; risk_from integer:=31; lost_after integer:=60; risk_visits integer:=2;
 as_of date:=(now() at time zone 'America/Mexico_City')::date;
 month_start date:=date_trunc('month',(now() at time zone 'America/Mexico_City'))::date;
begin
 perform 1 from nival_pr.customers where id=c for update;
 select pr.* into p from nival_pr.programs pr join nival_pr.customers cu on cu.business_id=pr.business_id where cu.id=c;
 if p.id is null then return null; end if;
 select coalesce(l.branch_id,pr.id) into br from nival_pr.point_ledger l
 cross join lateral (select id from nival_pr.branches where business_id=p.business_id and is_primary limit 1) pr
 where l.customer_id=c and l.type='visit' order by l.created_at desc,l.id desc limit 1;
 if br is null then select id into br from nival_pr.branches where business_id=p.business_id and is_primary limit 1; end if;
 select x.campaign_rules into rules from nival_pr.branches x where x.id=br and x.business_id=p.business_id;
 rules=coalesce(rules,p.rules->'campaign_rules');
 if p.mode='surprise' then
   select g.reward_id into r from nival_pr.customer_goals g where g.customer_id=c and g.locked limit 1;
   if r is not null then return r; end if;
   select rw.id into r from nival_pr.rewards rw where rw.program_id=p.id and rw.active
   and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0)
   order by -ln(greatest(random(),0.00000001))/greatest(rw.weight,1) limit 1;
   if r is not null then insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true)
     on conflict(customer_id,reward_id) do update set locked=true; end if;
   return r;
 end if;
 if p.mode='single' and rules is not null and jsonb_typeof(rules->'targets')='object' then
   select g.reward_id into r from nival_pr.customer_goals g join nival_pr.rewards rw on rw.id=g.reward_id
   where g.customer_id=c and g.locked and rw.program_id=p.id limit 1;
   if r is not null then return r; end if;
   select coalesce(max(s.new_days),14),coalesce(max(s.frequent_days),30),coalesce(max(s.frequent_visits),3),
    coalesce(max(s.risk_from),31),coalesce(max(s.lost_after),60),coalesce(max(s.risk_visits),2)
   into new_days,frequent_days,frequent_visits,risk_from,lost_after,risk_visits
   from nival_pr.segment_settings s where s.business_id=p.business_id;
   select count(*) filter(where (l.created_at at time zone 'America/Mexico_City')::date>as_of-frequent_days)::int,
    count(*)::int,min((l.created_at at time zone 'America/Mexico_City')::date),max((l.created_at at time zone 'America/Mexico_City')::date)
   into recent_visits,lifetime_visits,first_visit,last_visit
   from nival_pr.point_ledger l where l.customer_id=c and l.type='visit'
    and (l.branch_id=br or (l.branch_id is null and exists(select 1 from nival_pr.branches x where x.id=br and x.is_primary)))
    and (l.created_at at time zone 'America/Mexico_City')::date<=as_of;
   if recent_visits>=frequent_visits then audience:='frequent';
   elsif last_visit is not null and as_of-last_visit between risk_from and lost_after and lifetime_visits>=risk_visits then audience:='at_risk';
   elsif last_visit is not null and as_of-last_visit>lost_after then audience:='lost';
   elsif first_visit is not null and first_visit>as_of-new_days then audience:='new';
   elsif last_visit is null or last_visit<month_start then audience:='absent'; end if;
   candidates=rules#>array['targets',audience];
   if jsonb_typeof(candidates)<>'array' or jsonb_array_length(candidates)=0 then candidates=rules#>'{targets,all}'; end if;
   select rw.id into r from nival_pr.rewards rw where rw.program_id=p.id and rw.active
     and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0)
     and exists(select 1 from jsonb_array_elements_text(coalesce(candidates,'[]'::jsonb)) as selected(id) where selected.id=rw.id::text)
   order by case when rules->>'strategy'='random' then random() else 0 end,rw.position,rw.id limit 1;
   if r is not null then
     insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true)
     on conflict(customer_id,reward_id) do update set locked=true;
     return r;
   end if;
 end if;
 with ordered as(
  select rw.id,row_number() over(order by rw.position,rw.id)-1 idx,count(*) over() total
  from nival_pr.rewards rw where rw.program_id=p.id and rw.active
  and (rw.expires_at is null or rw.expires_at>now()) and (rw.stock is null or rw.stock>0)
 ),completed as(
  select count(*) n from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id
  where l.customer_id=c and d.status<>'revertido'
 )
 select o.id into r from ordered o cross join completed x where
 (p.mode='single' and o.idx=0) or
 (p.mode='sequence' and o.idx=x.n%o.total) or
 (p.mode='choose' and exists(select 1 from nival_pr.customer_goals g where g.customer_id=c and g.reward_id=o.id and g.locked))
 limit 1;
 return r;
end $$;

commit;
