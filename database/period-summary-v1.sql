-- Monthly Nival plan summaries. Additive: existing review reports and source rows stay intact.
begin;

alter table nival_pr.generated_reports drop constraint if exists generated_reports_kind_check;
alter table nival_pr.generated_reports add constraint generated_reports_kind_check
 check(kind in ('diagnosis','week','month','period_summary'));
create unique index if not exists generated_reports_period_summary_once
 on nival_pr.generated_reports(business_id,period_start,period_end) where kind='period_summary';

commit;
