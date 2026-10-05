begin;
alter table nival_pr.review_reports add column answered_scope text not null default 'legacy_total' check(answered_scope in ('legacy_total','period'));
commit;
