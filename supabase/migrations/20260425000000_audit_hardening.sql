-- =============================================================================
-- Backend Audit Hardening
--
-- This migration addresses security and performance gaps identified during audit:
-- 1. Adds missing explicit RLS policies for revenuecat_webhook_events.
-- 2. Hardens helper functions with SECURITY DEFINER and search_path.
-- 3. Adds missing indexes on foreign keys frequently used in RLS JOINs.
-- =============================================================================

-- 1. Harden revenuecat_webhook_events
-- Ensure RLS is enabled and only service_role can manage these logs.
ALTER TABLE public.revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role can manage RC events"
    ON public.revenuecat_webhook_events
    FOR ALL
    TO authenticated
    USING ((select auth.jwt())->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- 2. Harden Functions (Security Definer best practices)
-- Already handled for get_user_id_by_email and recalc_project_totals, 
-- but ensuring handle_updated_at is localized.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- 3. Optimization: Indexes for RLS JOIN performance
-- High-frequency RLS policies use these paths: 
-- documents -> projects -> properties
-- invoices -> projects -> properties
-- etc.

-- Most are covered, but ensuring secondary metadata tables are snappy:
CREATE INDEX IF NOT EXISTS idx_seller_packets_project_id ON public.seller_packets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_view_tokens_project_id ON public.project_view_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_project_passes_project_id ON public.project_passes(project_id);
-- Ensure marketing_leads has an index on email for quick lookup if needed
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON public.marketing_leads(email);
