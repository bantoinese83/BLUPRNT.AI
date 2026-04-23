-- =============================================================================
-- Intelligence Roadmap: Grounding & Bulk Scale
--
-- 1. Adds grounding_sources to track AI reasoning for trust.
-- =============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS grounding_sources jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.projects.grounding_sources IS 
  'List of data sources and logic citations (e.g. ZIP-specific labor rates) used by the AI for the initial estimate.';
