begin;

-- One staff-recorded visit earns the configured points. A customer can return
-- more than once in a day; purchases during the same stay are handled by staff.
alter table nival_pr.programs
  alter column rules set default '{"min_hours_between_visits":0,"max_visits_per_day":2147483647}';

update nival_pr.programs
set rules = jsonb_set(
  jsonb_set(coalesce(rules, '{}'::jsonb), '{min_hours_between_visits}', '0'::jsonb, true),
  '{max_visits_per_day}',
  '2147483647'::jsonb,
  true
);

commit;
