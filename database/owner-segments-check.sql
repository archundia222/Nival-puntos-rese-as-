-- Manual check, execute under npr_v2_owner with npr.user_id set to the fixture owner.
-- Test fixture: 20 cards, date 2026-10-05. Expected 4 / 4 / 4 / 4 / 12.
select count(*) total,
 count(*) filter(where is_new) nuevos,
 count(*) filter(where is_frequent) frecuentes,
 count(*) filter(where is_risk) riesgo,
 count(*) filter(where is_lost) perdidos,
 count(*) filter(where absent_month) no_este_mes
from nival_pr.customer_segments('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-05');
