-- Remove SECURITY DEFINER to ensure RLS is enforced on the projects update
CREATE OR REPLACE FUNCTION public.recalc_project_totals(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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
