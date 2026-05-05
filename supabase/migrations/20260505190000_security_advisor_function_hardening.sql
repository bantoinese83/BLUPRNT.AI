-- Security Advisor (splinter): pin search_path on mutable functions and tighten EXECUTE
-- on SECURITY DEFINER helpers. Onboarding sync payload is loaded via Edge Function
-- (service_role); browser no longer calls the RPC directly.

ALTER FUNCTION public.cleanup_stale_onboarding_sync() SET search_path = public;
ALTER FUNCTION public.get_system_config(text) SET search_path = public;
ALTER FUNCTION public.handle_welcome_email() SET search_path = public;
ALTER FUNCTION public.handle_document_type_default() SET search_path = public;
ALTER FUNCTION public.handle_processing_failure_sync() SET search_path = public;

-- get_onboarding_sync_payload: service_role + Edge Function only
REVOKE ALL ON FUNCTION public.get_onboarding_sync_payload(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO service_role;

-- cleanup_stale_onboarding_sync: pg_cron runs as postgres; clients must not call
REVOKE ALL ON FUNCTION public.cleanup_stale_onboarding_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_onboarding_sync() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_onboarding_sync() TO service_role;

-- App config helper: not for end-user sessions
REVOKE EXECUTE ON FUNCTION public.get_system_config(text) FROM authenticated;

-- Ledger slot RPCs: Edge Functions (service_role) only
REVOKE EXECUTE ON FUNCTION public.reserve_architect_ledger_upload_slot(uuid, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.release_architect_ledger_upload_slot(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_architect_ledger_upload_slot(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_architect_ledger_upload_slot(uuid) TO service_role;
