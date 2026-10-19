-- Explicit optional Wallet marketing consent. Saving a card does not confirm it was added.
CREATE TABLE IF NOT EXISTS nival_pr_private.wallet_preferences (
 customer_id uuid PRIMARY KEY REFERENCES nival_pr.customers(id) ON DELETE CASCADE,
 business_id uuid NOT NULL REFERENCES nival_pr.businesses(id) ON DELETE CASCADE,
 notifications_opt_in boolean NOT NULL DEFAULT false,
 opted_in_at timestamptz,
 pass_add_confirmed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_preferences_business ON nival_pr_private.wallet_preferences(business_id);
-- No grants to customer/owner roles: writes happen only after server-side card authentication.
