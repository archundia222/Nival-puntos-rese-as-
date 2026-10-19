-- Campaign history is separate from points and rewards.
CREATE TABLE IF NOT EXISTS nival_pr.campaign_sends (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES nival_pr.businesses(id) ON DELETE CASCADE,
 segment text NOT NULL CHECK(segment IN ('new','risk','frequent','near_reward')),
 channel text NOT NULL CHECK(channel IN ('manual','wallet')),
 customer_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
 sent_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL
);
CREATE INDEX IF NOT EXISTS campaign_sends_business_date ON nival_pr.campaign_sends(business_id,sent_at DESC);
GRANT SELECT,INSERT ON nival_pr.campaign_sends TO npr_app,npr_v2_owner;
