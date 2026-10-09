-- Additive groundwork for API driven review and task workflows.
-- Safe to apply after the existing foundation/reputation migrations; no existing rows are deleted or rewritten.
alter table if exists nival_pr.review_reports
  add column if not exists source text not null default 'manual'
    check (source in ('manual','google_api','other_api')),
  add column if not exists ingestion_status text not null default 'manual'
    check (ingestion_status in ('manual','assisted','automatic'));

alter table if exists nival_pr.tasks
  add column if not exists execution_mode text not null default 'manual'
    check (execution_mode in ('manual','assisted','automatic'));

create table if not exists nival_pr.review_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references nival_pr.businesses(id) on delete cascade,
  source text not null default 'manual' check (source in ('manual','google_api','other_api')),
  external_id text,
  author_name text,
  rating smallint check (rating between 1 and 5),
  review_text text not null default '',
  reviewed_at timestamptz,
  review_status text not null default 'pending' check (review_status in ('pending','drafted','approved','published')),
  response_text text,
  response_status text not null default 'pending' check (response_status in ('pending','drafted','approved','published')),
  created_by uuid references nival_pr.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, source, external_id)
);
create index if not exists review_items_business_date_idx
  on nival_pr.review_items (business_id, reviewed_at desc);
