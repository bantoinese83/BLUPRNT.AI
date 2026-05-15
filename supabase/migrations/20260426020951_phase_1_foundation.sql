-- 1. RLS Performance Denormalization & AI Verification

-- Add owner_user_id to denormalize for performance
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.scope_items ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
-- Add AI verification flag
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
-- Backfill existing records
UPDATE public.projects p
SET owner_user_id = pr.owner_user_id
FROM public.properties pr
WHERE p.property_id = pr.id AND p.owner_user_id IS NULL;
-- Triggers to maintain owner_user_id (Defense in depth)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_project_insert_sync_owner
  BEFORE INSERT OR UPDATE OF property_id, owner_user_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_project_owner_sync();
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_document_insert_sync_owner
  BEFORE INSERT OR UPDATE OF project_id, owner_user_id ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_owner_sync();
CREATE OR REPLACE TRIGGER on_invoice_insert_sync_owner
  BEFORE INSERT OR UPDATE OF project_id, owner_user_id ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_owner_sync();
CREATE OR REPLACE TRIGGER on_scope_item_insert_sync_owner
  BEFORE INSERT OR UPDATE OF project_id, owner_user_id ON public.scope_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_owner_sync();
-- RLS Policies with Robust Join Fallback
-- This ensures that even if triggers are bypassed or mid-transaction, 
-- existing join-based auth still works, preventing timeouts/empty data.

-- Projects
DROP POLICY IF EXISTS "Users can manage projects of their own properties" ON public.projects;
DROP POLICY IF EXISTS "projects_access_policy" ON public.projects;
CREATE POLICY "projects_access_policy"
  ON public.projects FOR ALL
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid()) OR 
    EXISTS (SELECT 1 FROM properties WHERE properties.id = projects.property_id AND properties.owner_user_id = (SELECT auth.uid()))
  );
-- Documents
DROP POLICY IF EXISTS "documents_all_via_project" ON public.documents;
DROP POLICY IF EXISTS "documents_access_policy" ON public.documents;
CREATE POLICY "documents_access_policy"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM projects JOIN properties ON projects.property_id = properties.id WHERE projects.id = documents.project_id AND properties.owner_user_id = (SELECT auth.uid()))
  );
-- Invoices
DROP POLICY IF EXISTS "invoices_all_via_project" ON public.invoices;
DROP POLICY IF EXISTS "invoices_access_policy" ON public.invoices;
CREATE POLICY "invoices_access_policy"
  ON public.invoices FOR ALL
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM projects JOIN properties ON projects.property_id = properties.id WHERE projects.id = invoices.project_id AND properties.owner_user_id = (SELECT auth.uid()))
  );
-- Scope Items
DROP POLICY IF EXISTS "Users can manage scope items of their own projects" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_access_policy" ON public.scope_items;
CREATE POLICY "scope_items_access_policy"
  ON public.scope_items FOR ALL
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM projects JOIN properties ON projects.property_id = properties.id WHERE projects.id = scope_items.project_id AND properties.owner_user_id = (SELECT auth.uid()))
  );
-- 3. Storage Cleanup Automation
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Centralized configuration helper for Service Discovery
CREATE OR REPLACE FUNCTION public.get_system_config(config_key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, these could be stored in a table. 
  -- For this architecture, we centralize them here to avoid scattering hardcoded URLs.
  IF config_key = 'edge_functions_base_url' THEN
    RETURN 'http://supabase_functions_blueprintai-v3:9000';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger on document deletion
CREATE OR REPLACE TRIGGER on_document_deleted_cleanup_storage
  AFTER DELETE ON public.documents
  FOR EACH ROW
  WHEN (OLD.storage_path IS NOT NULL)
  EXECUTE FUNCTION public.handle_storage_cleanup();
