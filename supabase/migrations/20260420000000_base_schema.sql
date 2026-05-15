/*
 * Core application schema: properties, projects, scope, documents, invoices.
 * Runs before 20260420100000_consolidated_schema.sql (RLS, subscriptions, storage, etc.).
 *
 * Uses CREATE IF NOT EXISTS / additive patterns so existing projects can apply this
 * once without errors if tables already exist.
 */

-- -----------------------------------------------------------------------------
-- properties
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  postal_code text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'US',
  approximate_location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_properties_owner_user_id ON public.properties (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_postal ON public.properties (owner_user_id, postal_code);
-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  name text NOT NULL,
  type text,
  stage text,
  estimated_min_total numeric,
  estimated_max_total numeric,
  confidence_score numeric,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_property_id ON public.projects (property_id);
-- -----------------------------------------------------------------------------
-- scope_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scope_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  finish_tier text,
  quantity numeric,
  unit text,
  unit_cost_min numeric,
  unit_cost_max numeric,
  total_cost_min numeric,
  total_cost_max numeric,
  confidence_score numeric,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scope_items_project_id ON public.scope_items (project_id);
-- -----------------------------------------------------------------------------
-- documents (Storage metadata for project-documents bucket)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  type text NOT NULL,
  storage_path text NOT NULL,
  original_filename text,
  uploaded_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  ocr_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents (project_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by_user_id ON public.documents (uploaded_by_user_id);
-- -----------------------------------------------------------------------------
-- invoices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  document_type text NOT NULL DEFAULT 'invoice',
  vendor_name text,
  invoice_number text,
  issue_date date,
  due_date date,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric,
  tax_total numeric,
  total numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices (project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_document_id ON public.invoices (document_id);
-- -----------------------------------------------------------------------------
-- invoice_line_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric,
  unit_price numeric,
  unit_of_measure text NOT NULL DEFAULT 'ea',
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  line_total numeric,
  category text,
  scope_item_id uuid REFERENCES public.scope_items (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_scope_item_id ON public.invoice_line_items (scope_item_id);
