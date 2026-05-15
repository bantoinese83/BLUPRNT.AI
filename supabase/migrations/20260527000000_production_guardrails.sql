-- Production guardrails: prevent inverted project estimate ranges.

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_estimate_range_valid;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_estimate_range_valid
  CHECK (
    estimated_min_total IS NULL
    OR estimated_max_total IS NULL
    OR estimated_min_total <= estimated_max_total
  );

COMMENT ON CONSTRAINT projects_estimate_range_valid ON public.projects IS
  'Ensures low estimate does not exceed high estimate.';
