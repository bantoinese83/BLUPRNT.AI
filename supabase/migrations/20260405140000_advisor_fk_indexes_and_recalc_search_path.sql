-- Supabase advisor: SECURITY DEFINER search_path; unindexed foreign keys.
-- See https://supabase.com/docs/guides/database/database-linter

CREATE OR REPLACE FUNCTION public.recalc_project_totals(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min NUMERIC;
  v_max NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(total_cost_min), 0),
    COALESCE(SUM(total_cost_max), 0)
  INTO v_min, v_max
  FROM public.scope_items
  WHERE project_id = p_id;

  UPDATE public.projects
  SET
    estimated_min_total = ROUND(v_min),
    estimated_max_total = ROUND(v_max),
    updated_at = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_project_totals(UUID) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by_user_id
  ON public.documents (uploaded_by_user_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id
  ON public.invoice_line_items (invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_scope_item_id
  ON public.invoice_line_items (scope_item_id);

CREATE INDEX IF NOT EXISTS idx_seller_packets_property_id
  ON public.seller_packets (property_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_last_active_project_id
  ON public.user_preferences (last_active_project_id);
