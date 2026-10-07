begin;
create table if not exists nival_pr_private.evidence_objects (
 path text primary key references nival_pr_private.evidence_uploads(path),
 object_key text unique not null,
 mime text not null check(mime in ('image/jpeg','image/png','image/webp')),
 size_bytes integer not null check(size_bytes between 12 and 3145728),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
alter table nival_pr_private.evidence_objects enable row level security;
revoke all on nival_pr_private.evidence_objects from public;
create or replace function nival_pr_private.store_photo_object(b uuid,c uuid,p text,k text,m text,s integer,h text) returns void language plpgsql security definer set search_path='' as $$ begin
 if k is distinct from 'evidence/'||p then raise exception 'Invalid object key';end if;
 perform nival_pr_private.verify_evidence(b,c,p);
 insert into nival_pr_private.evidence_objects(path,object_key,mime,size_bytes,sha256) values(p,k,m,s,h);
end $$;
revoke all on function nival_pr_private.store_photo_object(uuid,uuid,text,text,text,integer,text) from public;
grant execute on function nival_pr_private.store_photo_object(uuid,uuid,text,text,text,integer,text) to npr_v2_auth;
create or replace function nival_pr_private.read_photo_object(d uuid) returns table(object_key text,mime text) language plpgsql security definer set search_path='' as $$ declare b uuid;begin
 select l.business_id into b from nival_pr.redemptions rd join nival_pr.point_ledger l on l.id=rd.ledger_id where rd.id=d;
 if not exists(select 1 from nival_pr.profiles where id=nival_pr.uid() and role='superadmin') then perform nival_pr_private.assert_owner(b);end if;
 return query select e.object_key,e.mime from nival_pr_private.evidence_objects e join nival_pr.redemptions rd on rd.photo_path=e.path where rd.id=d;
end $$;
revoke all on function nival_pr_private.read_photo_object(uuid) from public;
grant execute on function nival_pr_private.read_photo_object(uuid) to npr_v2_auth;
-- Conserva datos heredados para migrarlos, pero impide nuevas fotos binarias.
revoke execute on function nival_pr_private.store_photo(uuid,uuid,text,text,text) from npr_v2_auth;
revoke execute on function nival_pr_private.read_photo(uuid) from npr_v2_auth;
commit;
