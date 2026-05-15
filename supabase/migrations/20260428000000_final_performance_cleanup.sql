-- =============================================================================
-- Final Performance Cleanup
--
-- Removes truly redundant indexes where a composite index already covers
-- the prefix, as identified during the backend audit.
--
-- NOTE: We are NOT removing the other "unused" indexes flagged by the linter 
-- because they were recently created and are essential for RLS (Row Level 
-- Security) performance as the dataset grows.
-- =============================================================================

-- Redundant: idx_properties_owner_postal(owner_user_id, postal_code) 
-- already covers this prefix.
DROP INDEX IF EXISTS public.idx_properties_owner_user_id;
COMMENT ON INDEX public.idx_properties_owner_postal IS 
  'Primary composite index for property ownership and location lookups. Covers owner_user_id prefix.';
