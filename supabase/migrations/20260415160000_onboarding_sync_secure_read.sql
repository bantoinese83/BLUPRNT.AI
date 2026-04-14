-- Replace permissive SELECT (all non-expired rows visible) with token-scoped RPC.

DROP POLICY IF EXISTS "Anyone with token can read sync record" ON public.onboarding_sync;

CREATE OR REPLACE FUNCTION public.get_onboarding_sync_payload(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payload
  FROM public.onboarding_sync
  WHERE token = p_token
    AND expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_onboarding_sync_payload(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO authenticated;
