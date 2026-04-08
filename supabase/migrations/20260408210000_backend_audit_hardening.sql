-- Marketing leads: only service role (Edge Functions) can insert — no direct anon/auth INSERT.
DROP POLICY IF EXISTS marketing_leads_insert_public ON public.marketing_leads;

-- RevenueCat webhook idempotency (duplicate event.id deliveries).
CREATE TABLE IF NOT EXISTS public.revenuecat_webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;
