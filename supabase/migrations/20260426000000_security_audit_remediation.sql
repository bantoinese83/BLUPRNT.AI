-- =============================================================================
-- Security Audit Remediation
--
-- 1. Hardens public.onboarding_sync RLS to remove WITH CHECK (true).
--    Even for anonymous inserts, we now enforce basic structural constraints
--    to prevent blank-row spam and improve auditability.
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can create a sync record" ON public.onboarding_sync;
CREATE POLICY "Anyone can create a sync record"
ON public.onboarding_sync
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(token) >= 32
  AND jsonb_typeof(payload) = 'object'
  AND payload != '{}'::jsonb
);
COMMENT ON POLICY "Anyone can create a sync record" ON public.onboarding_sync IS
  'Allows anonymous creation of onboarding sync records if the token and payload meet minimum structural requirements.';
