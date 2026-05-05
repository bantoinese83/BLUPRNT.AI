-- Run after `get-onboarding-sync-payload` Edge Function is deployed and web uses invokeFunction().
-- (A hotfix migration temporarily re-granted anon/authenticated EXECUTE on production until deploy.)

REVOKE EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO service_role;
