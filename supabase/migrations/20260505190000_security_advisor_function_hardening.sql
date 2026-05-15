-- Security Advisor (splinter): functions that exist at this point in the chain.
-- Deferred items: 20260529000000_security_advisor_deferred.sql

ALTER FUNCTION public.get_system_config(text) SET search_path = public;

REVOKE ALL ON FUNCTION public.get_onboarding_sync_payload(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_system_config(text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.release_architect_invoice_upload_slot(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_architect_invoice_upload_slot(uuid) TO service_role;
