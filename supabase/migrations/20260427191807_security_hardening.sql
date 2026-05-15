-- 1. Move vector extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
-- 2. Harden Functions (search_path and EXECUTE permissions)

-- public.get_system_config
CREATE OR REPLACE FUNCTION public.get_system_config(config_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF config_key = 'edge_functions_base_url' THEN
    RETURN 'http://supabase_functions_blueprintai-v3:9000';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = public;
REVOKE ALL ON FUNCTION public.get_system_config(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_system_config(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_config(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_system_config(TEXT) TO authenticated;
-- public.match_document_embeddings
CREATE OR REPLACE FUNCTION public.match_document_embeddings (
  query_embedding extensions.vector(768),
  match_threshold float,
  match_count int,
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM public.document_embeddings de
  WHERE de.project_id = p_project_id
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
REVOKE ALL ON FUNCTION public.match_document_embeddings(extensions.vector(768), float, int, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_document_embeddings(extensions.vector(768), float, int, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_embeddings(extensions.vector(768), float, int, UUID) TO authenticated;
-- public.handle_project_owner_sync
CREATE OR REPLACE FUNCTION public.handle_project_owner_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    SELECT owner_user_id INTO NEW.owner_user_id
    FROM public.properties
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_project_owner_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_project_owner_sync() FROM anon, authenticated;
-- public.handle_child_owner_sync
CREATE OR REPLACE FUNCTION public.handle_child_owner_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    SELECT owner_user_id INTO NEW.owner_user_id
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_child_owner_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_child_owner_sync() FROM anon, authenticated;
-- public.handle_document_queue_insert
CREATE OR REPLACE FUNCTION public.handle_document_queue_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := public.get_system_config('edge_functions_base_url') || '/process-document-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'queue_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_document_queue_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_document_queue_insert() FROM anon, authenticated;
-- public.handle_storage_cleanup
CREATE OR REPLACE FUNCTION public.handle_storage_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := public.get_system_config('edge_functions_base_url') || '/cleanup-storage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'storage_path', OLD.storage_path
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_storage_cleanup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_storage_cleanup() FROM anon, authenticated;
-- public.get_onboarding_sync_payload
REVOKE ALL ON FUNCTION public.get_onboarding_sync_payload(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO authenticated;
-- public.handle_updated_at
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;
-- public.handle_welcome_email
CREATE OR REPLACE FUNCTION public.handle_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  prop_count int;
BEGIN
  SELECT count(*) INTO prop_count FROM public.properties WHERE owner_user_id = NEW.owner_user_id;
  IF prop_count = 1 THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.owner_user_id;
    IF user_email IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := current_setting('supabase_url') || '/functions/v1/send-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase_service_role_key')
          ),
          body := jsonb_build_object(
            'to', user_email,
            'template', 'welcome',
            'params', jsonb_build_object(
              'userName', user_email
            )
          )
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_welcome_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_welcome_email() FROM anon, authenticated;
-- Architect upload slot RPCs (invoice naming until 20260525000000_refactor_ledger_entitlements)
REVOKE ALL ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) TO authenticated;
REVOKE ALL ON FUNCTION public.release_architect_invoice_upload_slot(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_architect_invoice_upload_slot(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_architect_invoice_upload_slot(uuid) TO authenticated;
-- project_gallery + physical_assets RLS: see 20260528000000_security_hardening_child_tables.sql
