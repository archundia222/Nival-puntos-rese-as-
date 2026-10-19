-- Keep the private schema hidden from staff while allowing only reward eligibility checks.
CREATE OR REPLACE FUNCTION nival_pr.reward_is_redeemable(customer_id uuid,reward_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT nival_pr_private.reward_is_redeemable(customer_id,reward_id) $$;
REVOKE ALL ON FUNCTION nival_pr.reward_is_redeemable(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION nival_pr.reward_is_redeemable(uuid,uuid) TO npr_v2_staff,npr_v2_owner,npr_v2_admin,npr_v2_auth;
