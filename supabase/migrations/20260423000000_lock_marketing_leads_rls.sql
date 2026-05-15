-- =============================================================================
-- Lock marketing_leads inserts to service_role only.
--
-- Previously the table allowed any anon/authenticated user to INSERT directly
-- via PostgREST. All legitimate inserts go through the submit-marketing-lead
-- Edge function which uses the service_role client, so direct PostgREST access
-- is unnecessary and widens the attack surface.
-- =============================================================================

DROP POLICY IF EXISTS marketing_leads_insert_public ON public.marketing_leads;
DROP POLICY IF EXISTS "marketing_leads_insert_public" ON public.marketing_leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.marketing_leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.marketing_leads;
-- No INSERT policy = only service_role (used by the Edge function) can insert.
-- The existing SELECT policy for service_role is retained unchanged.;
