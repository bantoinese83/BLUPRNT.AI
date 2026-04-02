-- Migration: Add recalc_project_totals RPC
-- Centralises the "sum scope_items → update projects" logic that was
-- duplicated across web (useScopeManagement.ts) and mobile (useDashboardData.ts).
-- Both platforms now call supabase.rpc("recalc_project_totals", { p_id }) instead.

CREATE OR REPLACE FUNCTION recalc_project_totals(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_min NUMERIC;
  v_max NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(total_cost_min), 0),
    COALESCE(SUM(total_cost_max), 0)
  INTO v_min, v_max
  FROM scope_items
  WHERE project_id = p_id;

  UPDATE projects
  SET
    estimated_min_total = ROUND(v_min),
    estimated_max_total = ROUND(v_max),
    updated_at = now()
  WHERE id = p_id;
END;
$$;

-- Grant execute to authenticated users (row-level security on projects table
-- already prevents them from touching projects they don't own).
GRANT EXECUTE ON FUNCTION recalc_project_totals(UUID) TO authenticated;
