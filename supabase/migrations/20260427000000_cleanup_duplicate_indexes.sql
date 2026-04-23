-- =============================================================================
-- Cleanup Duplicate Indexes
--
-- Drops redundant indexes identified by the database linter.
-- Prefers the more explicit 'idx_<table>_<column>_id' naming convention.
-- =============================================================================

DROP INDEX IF EXISTS public.idx_documents_project;
DROP INDEX IF EXISTS public.idx_invoices_project;
DROP INDEX IF EXISTS public.idx_project_passes_project;
DROP INDEX IF EXISTS public.idx_project_view_tokens_project;
DROP INDEX IF EXISTS public.idx_projects_property;
DROP INDEX IF EXISTS public.idx_properties_owner;
DROP INDEX IF EXISTS public.idx_scope_items_project;
DROP INDEX IF EXISTS public.idx_seller_packets_project;

-- Ensure the primary indexes exist (they are defined in previous migrations, 
-- but this migration serves as the final source of truth for these names).
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_passes_project_id ON public.project_passes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_view_tokens_project_id ON public.project_view_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_property_id ON public.projects(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_user_id ON public.properties(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_scope_items_project_id ON public.scope_items(project_id);
CREATE INDEX IF NOT EXISTS idx_seller_packets_project_id ON public.seller_packets(project_id);
