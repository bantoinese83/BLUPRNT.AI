-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add updated_at columns to core tables missing them
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.scope_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.project_passes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.seller_packets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Apply triggers to tracked tables
-- projects
DROP TRIGGER IF EXISTS on_projects_updated ON public.projects;
CREATE TRIGGER on_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- properties
DROP TRIGGER IF EXISTS on_properties_updated ON public.properties;
CREATE TRIGGER on_properties_updated
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- scope_items
DROP TRIGGER IF EXISTS on_scope_items_updated ON public.scope_items;
CREATE TRIGGER on_scope_items_updated
  BEFORE UPDATE ON public.scope_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- invoices
DROP TRIGGER IF EXISTS on_invoices_updated ON public.invoices;
CREATE TRIGGER on_invoices_updated
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- invoice_line_items
DROP TRIGGER IF EXISTS on_invoice_line_items_updated ON public.invoice_line_items;
CREATE TRIGGER on_invoice_line_items_updated
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- user_subscriptions
DROP TRIGGER IF EXISTS on_user_subscriptions_updated ON public.user_subscriptions;
CREATE TRIGGER on_user_subscriptions_updated
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- project_passes
DROP TRIGGER IF EXISTS on_project_passes_updated ON public.project_passes;
CREATE TRIGGER on_project_passes_updated
  BEFORE UPDATE ON public.project_passes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- user_preferences
DROP TRIGGER IF EXISTS on_user_preferences_updated ON public.user_preferences;
CREATE TRIGGER on_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- seller_packets
DROP TRIGGER IF EXISTS on_seller_packets_updated ON public.seller_packets;
CREATE TRIGGER on_seller_packets_updated
  BEFORE UPDATE ON public.seller_packets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
