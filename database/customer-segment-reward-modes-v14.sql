BEGIN;
-- New policies apply at the moment a customer's next reward is assigned.
-- Current locked goals are preserved across segment changes until redemption.
CREATE OR REPLACE FUNCTION nival_pr_private.reward_policy_for_customer(c uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $policy$
DECLARE
 p nival_pr.programs; rules jsonb; br uuid; audience text:='all'; mode text;
 scope text; selected jsonb; joined jsonb;
 as_of date:=(now() at time zone 'America/Mexico_City')::date;
 customer_created date;
 first_visit date; last_visit date;
 recent_visits integer:=0; lifetime_visits integer:=0;
 new_days integer:=30; frequent_days integer:=30; frequent_visits integer:=3; risk_from integer:=31; lost_after integer:=60; risk_visits integer:=2;
BEGIN
 SELECT pr, (cu.created_at at time zone 'America/Mexico_City')::date INTO p,customer_created
 FROM nival_pr.programs pr JOIN nival_pr.customers cu ON cu.business_id=pr.business_id WHERE cu.id=c;
 IF p.id IS NULL THEN RETURN NULL; END IF;
 SELECT l.branch_id INTO br FROM nival_pr.point_ledger l WHERE l.customer_id=c AND l.type='visit' AND l.branch_id IS NOT NULL ORDER BY l.created_at DESC,l.id DESC LIMIT 1;
 IF br IS NULL THEN SELECT id INTO br FROM nival_pr.branches WHERE business_id=p.business_id AND is_primary AND active LIMIT 1; END IF;
 rules=p.rules->'campaign_rules';
 scope=COALESCE(rules->>'scope','legacy');
 IF scope='legacy' THEN
   SELECT campaign_rules INTO joined FROM nival_pr.branches WHERE id=br AND business_id=p.business_id;
   rules=COALESCE(joined,rules);
 END IF;
 SELECT COALESCE(max(s.new_days),30),COALESCE(max(s.frequent_days),30),COALESCE(max(s.frequent_visits),3),
 COALESCE(max(s.risk_from),31),COALESCE(max(s.lost_after),60),COALESCE(max(s.risk_visits),2)
 INTO new_days,frequent_days,frequent_visits,risk_from,lost_after,risk_visits
 FROM nival_pr.segment_settings s WHERE s.business_id=p.business_id;
 SELECT COUNT(*) FILTER(WHERE (l.created_at at time zone 'America/Mexico_City')::date > as_of-frequent_days)::int,COUNT(*)::int,
 MIN((l.created_at at time zone 'America/Mexico_City')::date),MAX((l.created_at at time zone 'America/Mexico_City')::date)
 INTO recent_visits,lifetime_visits,first_visit,last_visit
 FROM nival_pr.point_ledger l WHERE l.customer_id=c AND l.type='visit' AND (l.branch_id=br OR l.branch_id IS NULL);
 IF recent_visits>=frequent_visits THEN audience:='frequent';
 ELSIF last_visit IS NOT NULL AND as_of-last_visit>lost_after THEN audience:='lost';
 ELSIF last_visit IS NOT NULL AND as_of-last_visit>=risk_from AND lifetime_visits>=risk_visits THEN audience:='at_risk';
 ELSIF customer_created IS NOT NULL AND customer_created>as_of-new_days THEN audience:='new';
 ELSIF last_visit IS NULL OR last_visit<date_trunc('month',(now() at time zone 'America/Mexico_City'))::date THEN audience:='absent';
 END IF;
 mode=COALESCE(rules->>'assignmentMode',CASE p.mode WHEN 'choose' THEN 'choose' WHEN 'surprise' THEN 'random' ELSE 'sequence' END);
 IF scope='segments' AND rules#>>ARRAY['segmentModes',audience] IN ('sequence','choose','random')
 THEN mode=rules#>>ARRAY['segmentModes',audience]; END IF;
 IF mode NOT IN ('sequence','choose','random') THEN mode:='sequence'; END IF;
 selected=rules#>ARRAY['targets',CASE WHEN scope='segments' THEN audience ELSE 'all' END];
 IF jsonb_typeof(selected)<>'array' OR jsonb_array_length(selected)=0 THEN selected=rules#>'{targets,all}'; END IF;
 IF jsonb_typeof(selected)<>'array' OR jsonb_array_length(selected)=0
 THEN SELECT COALESCE(jsonb_agg(rw.id ORDER BY rw.position,rw.id),'[]'::jsonb) INTO selected
 FROM nival_pr.rewards rw WHERE rw.program_id=p.id AND rw.active; END IF;
 SELECT COALESCE(jsonb_agg(rw.id ORDER BY rw.position,rw.id),'[]'::jsonb) INTO joined
 FROM nival_pr.rewards rw WHERE rw.program_id=p.id AND rw.active
 AND (rw.expires_at IS NULL OR rw.expires_at>now()) AND (rw.stock IS NULL OR rw.stock>0)
 AND EXISTS(SELECT 1 FROM jsonb_array_elements_text(selected) AS item(id) WHERE item.id=rw.id::text);
 RETURN jsonb_build_object('mode',mode,'audience',audience,'reward_ids',joined);
END $policy$;

CREATE OR REPLACE FUNCTION nival_pr_private.next_reward(c uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 p nival_pr.programs; r uuid; br uuid; rules jsonb; audience text:='all'; candidates jsonb;
 policy jsonb; effective_mode text; reward_ids uuid[]; next_index integer; completed_count integer;
 recent_visits integer:=0; lifetime_visits integer:=0; first_visit date; last_visit date; new_days integer:=14;
 frequent_days integer:=30; frequent_visits integer:=3; risk_from integer:=31; lost_after integer:=60; risk_visits integer:=2;
 as_of date:=(now() at time zone 'America/Mexico_City')::date;
 month_start date:=date_trunc('month',(now() at time zone 'America/Mexico_City'))::date;
begin
 perform 1 from nival_pr.customers where id=c for update;
 select pr.* into p from nival_pr.programs pr join nival_pr.customers cu on cu.business_id=pr.business_id where cu.id=c;
 if p.id is null then return null; end if;
 IF p.rules#>>'{campaign_rules,scope}' IN ('all','segments') THEN
   SELECT g.reward_id INTO r FROM nival_pr.customer_goals g JOIN nival_pr.rewards rw ON rw.id=g.reward_id
   WHERE g.customer_id=c AND g.locked AND rw.program_id=p.id AND rw.active ORDER BY g.reward_id LIMIT 1;
   IF r IS NOT NULL THEN RETURN r; END IF;
   policy=nival_pr_private.reward_policy_for_customer(c);
   effective_mode=policy->>'mode';
   SELECT array_agg(x.id ORDER BY x.position,x.id) INTO reward_ids
   FROM nival_pr.rewards x WHERE x.program_id=p.id AND x.active
   AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(policy->'reward_ids','[]'::jsonb)) item(id) WHERE item.id=x.id::text);
   IF COALESCE(array_length(reward_ids,1),0)=0 THEN RETURN NULL; END IF;
   IF effective_mode='choose' THEN RETURN NULL; END IF;
   IF effective_mode='random' THEN
     SELECT rw.id INTO r FROM nival_pr.rewards rw
     WHERE rw.id=ANY(reward_ids) ORDER BY random() LIMIT 1;
   ELSE
     SELECT count(*)::integer INTO completed_count FROM nival_pr.redemptions d JOIN nival_pr.point_ledger l ON l.id=d.ledger_id
     WHERE l.customer_id=c AND d.status<>'revertido';
     next_index=(completed_count % array_length(reward_ids,1))+1;
     r=reward_ids[next_index];
   END IF;
   IF r IS NOT NULL THEN INSERT INTO nival_pr.customer_goals(customer_id,reward_id,locked) VALUES(c,r,true)
     ON CONFLICT(customer_id,reward_id) DO UPDATE SET locked=true; END IF;
   RETURN r;
 END IF;
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
end $function$


CREATE OR REPLACE FUNCTION nival_pr_private.choose_goal(b uuid, h text, r uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare c uuid; begin
 select id into c from nival_pr.customers where business_id=b and device_token_hash=h and consent_at is not null and token_expires_at>now() for update;
 if c is null then raise exception 'Invalid token'; end if;
 if exists(select 1 from nival_pr.programs p where p.business_id=b and p.rules#>>'{campaign_rules,scope}' in ('all','segments')) then
   if (nival_pr_private.reward_policy_for_customer(c)->>'mode')<>'choose' then raise exception 'Este cliente no puede elegir la meta'; end if;
   if not exists(select 1 from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id join nival_pr.businesses bs on bs.id=p.business_id
     where rw.id=r and rw.active and p.business_id=b and bs.status in ('activo','por_vencer') and (bs.paid_until>now() or bs.trial_ends_at>now())
     and exists(select 1 from jsonb_array_elements_text(nival_pr_private.reward_policy_for_customer(c)->'reward_ids') as item(id) where item.id=r::text)
   ) then raise exception 'Premio no disponible para este cliente'; end if;
 else
  if not exists(select 1 from nival_pr.rewards rw join nival_pr.programs p on p.id=rw.program_id join nival_pr.businesses bs on bs.id=p.business_id where rw.id=r and rw.active and p.business_id=b and p.mode='choose' and bs.status='activo' and (bs.paid_until>now() or bs.trial_ends_at>now())) then raise exception 'Invalid reward'; end if;
 end if;
 if exists(select 1 from nival_pr.customer_goals where customer_id=c and locked and reward_id<>r) then raise exception 'Goal locked'; end if;
 insert into nival_pr.customer_goals(customer_id,reward_id,locked) values(c,r,true) on conflict(customer_id,reward_id) do update set locked=true;
 end $function$


CREATE OR REPLACE FUNCTION nival_pr_private.customer_card(b uuid, h text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object('id',c.id,'manual_code',c.manual_code,'name',c.name,'balance',(select coalesce(sum(points),0) from nival_pr.point_ledger where customer_id=c.id),'reward',(select jsonb_build_object('id',id,'name',name,'points_cost',points_cost) from nival_pr.rewards where id=nival_pr_private.next_reward(c.id)),
 'reward_mode',COALESCE(nival_pr_private.reward_policy_for_customer(c.id)->>'mode','sequence'),
 'eligible_rewards',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',rw.id,'name',rw.name,'points_cost',rw.points_cost) ORDER BY rw.position,rw.id) FROM nival_pr.rewards rw WHERE rw.program_id=(SELECT id FROM nival_pr.programs WHERE business_id=b) AND EXISTS(SELECT 1 FROM jsonb_array_elements_text(nival_pr_private.reward_policy_for_customer(c.id)->'reward_ids') AS item(id) WHERE item.id=rw.id::text)),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(x) from (select type,points,created_at from nival_pr.point_ledger where customer_id=c.id order by created_at desc,id desc limit 6)x),'[]'::jsonb))
 from nival_pr.customers c where c.business_id=b and c.device_token_hash=h and c.consent_at is not null and c.token_expires_at>now()
$function$


CREATE OR REPLACE FUNCTION nival_pr_private.guard_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p nival_pr.programs; balance bigint; cost integer; visits integer; last_visit timestamptz;
begin
 -- Verifica el actor antes de leer o bloquear datos: BEFORE triggers preceden WITH CHECK.
 if current_setting('role') in ('npr_v2_owner','npr_v2_staff') and not exists(
 select 1 from nival_pr.memberships m join nival_pr.profiles pr on pr.id=m.user_id
 where m.user_id=nival_pr.uid() and m.business_id=new.business_id and m.active
 and m.role=case when current_setting('role')='npr_v2_staff' then 'staff' else 'owner' end
 and pr.role=m.role and new.staff_id=m.user_id
 ) then raise exception 'row-level security: actor no autorizado'; end if;
 if new.reversal_of is not null and new.type<>'adjust' then raise exception 'Invalid reversal type'; end if;
 if new.type='adjust' and new.reward_id is not null then raise exception 'Adjust has no reward'; end if;
 -- Serializa todos los movimientos del cliente, incluidas solicitudes concurrentes.
 perform 1 from nival_pr.customers where id=new.customer_id and business_id=new.business_id for update;
 if not found then raise exception 'Cliente invalido'; end if;
 if new.type<>'adjust' and not exists(select 1 from nival_pr.businesses where id=new.business_id and status in ('activo','por_vencer') and (paid_until>now() or trial_ends_at>now())) then raise exception 'Servicio no activo'; end if;
 select * into p from nival_pr.programs where business_id=new.business_id;
 if not found then raise exception 'Programa no configurado'; end if;
 select coalesce(sum(points),0) into balance from nival_pr.point_ledger where customer_id=new.customer_id;
 new.created_at=now();
 if new.type='visit' then
  if new.points<>p.points_per_visit and not (new.points=p.points_per_visit*2 and (p.rules->>'double_points_weekday') ~ '^[0-6]$' and (p.rules->>'double_points_weekday')::integer=extract(dow from (now() at time zone 'America/Mexico_City'))::integer) then raise exception 'Cantidad de puntos invalida'; end if;
  select max(created_at),count(*) filter(where (created_at at time zone 'America/Mexico_City')::date=(now() at time zone 'America/Mexico_City')::date) into last_visit,visits from nival_pr.point_ledger where customer_id=new.customer_id and type='visit';
  if last_visit is not null and now()-last_visit < make_interval(secs=>((p.rules->>'min_hours_between_visits')::numeric*3600)::double precision) then raise exception 'Visita demasiado reciente'; end if;
  if visits >= (p.rules->>'max_visits_per_day')::integer then raise exception 'Limite diario'; end if;
 elsif new.type='redeem' then
  if new.evidence_path is null or new.evidence_path !~ ('^' || new.business_id::text || '/' || new.customer_id::text || '/[a-f0-9-]+[.](jpg|png|webp)$') then raise exception 'Foto obligatoria'; end if;
  if not exists(select 1 from nival_pr_private.evidence_uploads e where e.path=new.evidence_path and e.business_id=new.business_id and e.customer_id=new.customer_id and e.actor_id=new.staff_id and e.used_at is null and e.expires_at>now()) then raise exception 'Evidencia no verificada'; end if;

  select points_cost into cost from nival_pr.rewards where id=new.reward_id and program_id=p.id and active;
  if cost is null or new.points<>-cost then raise exception 'Premio invalido'; end if;
  if p.rules#>>'{campaign_rules,scope}' in ('all','segments') then
    if new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de la meta de este cliente'; end if;
  else
  if p.mode='single' and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera del modo single'; end if;
  if p.mode='choose' and not exists(select 1 from nival_pr.customer_goals where customer_id=new.customer_id and reward_id=new.reward_id and locked) then raise exception 'Selecciona tu meta antes de canjear'; end if;
  if p.mode in ('sequence','surprise') and new.reward_id is distinct from nival_pr_private.next_reward(new.customer_id) then raise exception 'Premio fuera de secuencia'; end if;
  end if;
 elsif new.type='adjust' then
  if new.reversal_of is null then
   if coalesce(current_setting('npr.manual_adjustment',true),'')<>'allowed' or not exists(select 1 from nival_pr.memberships where user_id=nival_pr.uid() and business_id=new.business_id and role='owner' and active) or length(trim(coalesce(new.note,'')))<5 then raise exception 'Ajuste requiere motivo y propietario';end if;
  elsif current_setting('role')='npr_v2_staff' then raise exception 'Reversion invalida';end if;

  if new.reversal_of is not null and not exists(select 1 from nival_pr.point_ledger l where l.id=new.reversal_of and l.customer_id=new.customer_id and l.business_id=new.business_id and l.type='redeem' and new.points=-l.points) then raise exception 'Reversion invalida'; end if;
 end if;
 if balance+new.points<0 then raise exception 'Saldo insuficiente'; end if;
 return new;
end $function$


CREATE OR REPLACE FUNCTION nival_pr_private.protect_mode_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
 if not (new.rules#>>'{campaign_rules,scope}' in ('all','segments')) and new.mode<>old.mode and exists(select 1 from nival_pr.customer_goals g join nival_pr.customers c on c.id=g.customer_id where c.business_id=old.business_id and g.locked) then raise exception 'Hay premios asignados pendientes. Cambia de modalidad después de entregarlos';end if;
 return new;end $function$

COMMIT;
