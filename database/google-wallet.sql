begin;
create table nival_pr_private.wallet_sync (
 customer_id uuid primary key references nival_pr.customers(id),
 business_id uuid not null references nival_pr.businesses(id),
 revision bigint not null default 1,
 synced_revision bigint not null default 0,
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_id uuid,
 lease_until timestamptz,
 last_synced_at timestamptz,
 last_error text
);
alter table nival_pr_private.wallet_sync enable row level security;
revoke all on nival_pr_private.wallet_sync from public,npr_v2_auth,npr_v2_owner,npr_v2_staff,npr_v2_customer;
create index wallet_sync_due on nival_pr_private.wallet_sync(available_at) where revision>synced_revision;
create function nival_pr_private.enqueue_wallet() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='point_ledger' then
  update nival_pr_private.wallet_sync set revision=revision+1,available_at=now(),attempts=0 where customer_id=new.customer_id and business_id=new.business_id;
 else
  update nival_pr_private.wallet_sync set revision=revision+1,available_at=now(),attempts=0 where business_id=new.business_id;
 end if;
 return new;
exception when others then
 -- Wallet bookkeeping must never roll back a points movement.
 raise warning 'Wallet enqueue failed';
 return new;
end $$;
revoke all on function nival_pr_private.enqueue_wallet() from public;
create trigger wallet_movement after insert on nival_pr.point_ledger for each row execute function nival_pr_private.enqueue_wallet();
create trigger wallet_program after update on nival_pr.programs for each row execute function nival_pr_private.enqueue_wallet();
commit;
