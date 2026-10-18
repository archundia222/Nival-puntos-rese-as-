BEGIN;
ALTER TABLE nival_pr.customers ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false;
ALTER TABLE nival_pr.customers ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;
CREATE TABLE IF NOT EXISTS nival_pr_private.wallet_campaign_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES nival_pr.businesses(id) ON DELETE CASCADE,
 customer_id uuid NOT NULL REFERENCES nival_pr.customers(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL,
 audience text NOT NULL CHECK(audience IN ('new','frequent','at_risk','lost','absent','all')),
 title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 60),
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 250),
 status text NOT NULL CHECK(status IN ('pending','sent','failed')),
 sent_at timestamptz,
 send_day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Mexico_City')::date),
 UNIQUE(customer_id,send_day),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_campaign_deliveries_customer_recent_idx ON nival_pr_private.wallet_campaign_deliveries(customer_id,created_at DESC);
REVOKE ALL ON nival_pr_private.wallet_campaign_deliveries FROM public;
COMMIT;