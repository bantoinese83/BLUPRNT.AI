-- Deferred security hardening for functions/tables created in later migrations.

DO $m$
BEGIN
  IF to_regprocedure('public.cleanup_stale_onboarding_sync()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.cleanup_stale_onboarding_sync() SET search_path = public';
    EXECUTE 'REVOKE ALL ON FUNCTION public.cleanup_stale_onboarding_sync() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.cleanup_stale_onboarding_sync() FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.cleanup_stale_onboarding_sync() TO service_role';
  END IF;

  IF to_regprocedure('public.handle_welcome_email()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_welcome_email() SET search_path = public';
  END IF;

  IF to_regprocedure('public.handle_document_type_default()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_document_type_default() SET search_path = public';
  END IF;

  IF to_regprocedure('public.handle_processing_failure_sync()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_processing_failure_sync() SET search_path = public';
  END IF;
END
$m$;

REVOKE EXECUTE ON FUNCTION public.reserve_architect_ledger_upload_slot(uuid, int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.release_architect_ledger_upload_slot(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_architect_ledger_upload_slot(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_architect_ledger_upload_slot(uuid) TO service_role;
