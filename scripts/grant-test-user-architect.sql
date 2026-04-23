-- Grant Architect (Pro) to test@test.com for local/staging QA.
-- Requires: user exists in auth.users.

INSERT INTO public.user_subscriptions (
  user_id,
  plan,
  status,
  current_period_end,
  revenuecat_entitlement_active,
  invoice_uploads_count
)
SELECT
  id,
  'architect',
  'active',
  (now() + interval '1 year'),
  true,
  0
FROM auth.users
WHERE email = 'test@test.com'
ON CONFLICT (user_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  revenuecat_entitlement_active = EXCLUDED.revenuecat_entitlement_active,
  updated_at = now();