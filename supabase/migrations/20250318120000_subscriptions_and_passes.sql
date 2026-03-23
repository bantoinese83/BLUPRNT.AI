-- Subscriptions and Project Passes for Stripe monetization

-- 1. User subscriptions (Architect plan: $12/mo, 10 invoice uploads/month)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'architect' CHECK (plan IN ('architect')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  invoice_uploads_count int NOT NULL DEFAULT 0,
  invoice_uploads_reset_at timestamptz DEFAULT date_trunc('month', now())::timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own subscription" ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Project Passes (one-time $49, 6 months of Architect features for one project)
CREATE TABLE IF NOT EXISTS project_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  stripe_checkout_session_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 months'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_passes_project ON project_passes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_passes_expires ON project_passes(expires_at);
ALTER TABLE project_passes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owners can read project passes" ON project_passes FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Helper for webhook: resolve user_id from email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;
