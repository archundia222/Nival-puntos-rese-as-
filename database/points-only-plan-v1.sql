-- Adds the monthly Nival Solo Puntos plan with no reputation features.
begin;
update nival_pr.plans
set price_mxn=299, interval='month',
    features=coalesce(features,'{}'::jsonb)||jsonb_build_object('points_only',true,'review_limit',0)
where name='Nival Solo Puntos';

insert into nival_pr.plans(name,price_mxn,interval,features)
select 'Nival Solo Puntos',299,'month','{"points_only":true,"review_limit":0}'::jsonb
where not exists(select 1 from nival_pr.plans where name='Nival Solo Puntos');
commit;
