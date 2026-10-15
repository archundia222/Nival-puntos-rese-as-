begin;
alter table nival_pr.reviews add column if not exists branch_id uuid;
alter table nival_pr.generated_reports add column if not exists branch_id uuid;
-- Existing legacy rows remain unassigned rather than being silently attributed to a different branch.
alter table nival_pr.reviews add constraint reviews_branch_business_fk foreign key(branch_id,business_id) references nival_pr.branches(id,business_id);
alter table nival_pr.generated_reports add constraint generated_reports_branch_business_fk foreign key(branch_id,business_id) references nival_pr.branches(id,business_id);
create index if not exists reviews_business_branch_date_idx on nival_pr.reviews(business_id,branch_id,reviewed_on);
create index if not exists generated_reports_business_branch_period_idx on nival_pr.generated_reports(business_id,branch_id,period_end);
commit;
