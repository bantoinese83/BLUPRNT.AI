/*
 * Consolidated database schema (single migration replacing 22 incremental files).
 *
 * For EXISTING hosted projects that already ran the older migrations: do not `db push`
 * this file blindly — it would re-run DDL. After pulling this commit, repair history:
 *
 *   supabase link --project-ref <ref>
 *   supabase migration repair --linked --status reverted \
 *     20260318000000 20260318100000 20260318110000 20260318120000 \
 *     20260324100000 20260324110000 20260402120000 20260402130000 \
 *     20260402140000 20260402150000 20260402160000 20260406134430 \
 *     20260406194620 20260407150000 20260408210000 20260409120000 \
 *     20260410000000 20260410010000 20260412132118 20260412150000 \
 *     20260415160000 20260416103000
 *   supabase migration repair --linked --status applied 20260420100000
 *
 * Fresh local DBs: `supabase db reset` runs `20260420000000_base_schema.sql` first, then this file.
 */

-- =============================================================================
-- Former 20260318100000_full_schema (project_view_tokens, seller_packets, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_view_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);
CREATE INDEX IF NOT EXISTS idx_project_view_tokens_token ON project_view_tokens(token);
CREATE INDEX IF NOT EXISTS idx_project_view_tokens_project ON project_view_tokens(project_id);
ALTER TABLE project_view_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_view_tokens' AND policyname = 'Owners can insert tokens') THEN
    CREATE POLICY "Owners can insert tokens" ON project_view_tokens FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    ));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_view_tokens' AND policyname = 'Owners can select own tokens') THEN
    CREATE POLICY "Owners can select own tokens" ON project_view_tokens FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    ));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_view_tokens' AND policyname = 'Owners can delete own tokens') THEN
    CREATE POLICY "Owners can delete own tokens" ON project_view_tokens FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    ));
  END IF;
END $$;

COMMENT ON TABLE project_view_tokens IS 'Shareable tokens for contractor/external project view. Use get-project-view edge function to fetch by token.';

ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS scope_item_id uuid REFERENCES scope_items(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS seller_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  generated_at timestamptz,
  storage_path text,
  UNIQUE(project_id)
);
CREATE INDEX IF NOT EXISTS idx_seller_packets_project ON seller_packets(project_id);
ALTER TABLE seller_packets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owners can insert seller packets" ON seller_packets FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id WHERE p.id = project_id AND pr.owner_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Owners can select seller packets" ON seller_packets FOR SELECT
    USING (EXISTS (SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id WHERE p.id = project_id AND pr.owner_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Owners can update seller packets" ON seller_packets FOR UPDATE
    USING (EXISTS (SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id WHERE p.id = project_id AND pr.owner_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- =============================================================================
-- Former 20260318110000_invoices_document_type
-- =============================================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'invoice';
UPDATE invoices SET document_type = 'invoice' WHERE document_type IS NULL;

-- =============================================================================
-- Former 20260318120000_subscriptions_and_passes
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'architect' CHECK (plan IN ('architect')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  invoice_uploads_count int NOT NULL DEFAULT 0,
  invoice_uploads_reset_at timestamptz DEFAULT date_trunc('month', now())::timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own subscription" ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS project_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  stripe_checkout_session_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 months'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_passes_project ON project_passes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_passes_expires ON project_passes(expires_at);
ALTER TABLE project_passes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owners can read project passes" ON project_passes FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;

-- =============================================================================
-- Former 20260324100000_lock_down_get_user_id_by_email
-- =============================================================================

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

-- =============================================================================
-- Former 20260324110000_add_marketing_leads
-- =============================================================================

CREATE TABLE IF NOT EXISTS marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'web',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can insert leads" ON marketing_leads FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can select leads" ON marketing_leads FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- Former 20260402120000 skipped — superseded by recalc with search_path below
-- =============================================================================

-- =============================================================================
-- Former 20260402130000_user_preferences
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  push_token text,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS push_token text;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_self"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Former 20260402140000_add_source_to_scope_items
-- =============================================================================

ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'text';
UPDATE scope_items SET source = 'text' WHERE source IS NULL;

-- =============================================================================
-- Former 20260402150000_enable_rls (ALTER only — policies replaced in initplan migration)
-- =============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Former 20260402160000_add_verification_to_scope_items
-- =============================================================================

ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS verification_required boolean DEFAULT false;

-- =============================================================================
-- Former 20260406134430_advisor_fk_indexes_and_recalc_search_path
-- =============================================================================

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

-- =============================================================================
-- Former 20260406194620_mcp_rls_initplan_and_policy_cleanup
-- =============================================================================

DROP POLICY IF EXISTS projects_all_via_property ON public.projects;
DROP POLICY IF EXISTS scope_items_all_via_project ON public.scope_items;

DROP POLICY IF EXISTS "Public can insert leads" ON public.marketing_leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.marketing_leads;
DROP POLICY IF EXISTS "Service role can select leads" ON public.marketing_leads;

CREATE POLICY "marketing_leads_insert_public"
ON public.marketing_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(email)) BETWEEN 3 AND 320
  AND (source IS NOT NULL AND char_length(trim(source)) BETWEEN 1 AND 64)
);

CREATE POLICY "Service role can select leads"
ON public.marketing_leads
FOR SELECT
TO authenticated
USING ((select auth.jwt())->>'role' = 'service_role');

DROP POLICY IF EXISTS user_preferences_self ON public.user_preferences;
CREATE POLICY user_preferences_self
ON public.user_preferences
FOR ALL
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own properties" ON public.properties;
CREATE POLICY "Users can manage their own properties"
ON public.properties
FOR ALL
TO authenticated
USING (owner_user_id = (select auth.uid()))
WITH CHECK (owner_user_id = (select auth.uid()));

DROP POLICY IF EXISTS properties_select_own ON public.properties;
DROP POLICY IF EXISTS properties_insert_own ON public.properties;
DROP POLICY IF EXISTS properties_update_own ON public.properties;
DROP POLICY IF EXISTS properties_delete_own ON public.properties;

DROP POLICY IF EXISTS "Users can manage projects of their own properties" ON public.projects;
CREATE POLICY "Users can manage projects of their own properties"
ON public.projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = projects.property_id
    AND properties.owner_user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = projects.property_id
    AND properties.owner_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can manage scope items of their own projects" ON public.scope_items;
CREATE POLICY "Users can manage scope items of their own projects"
ON public.scope_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.properties ON projects.property_id = properties.id
    WHERE projects.id = scope_items.project_id
    AND properties.owner_user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.properties ON projects.property_id = properties.id
    WHERE projects.id = scope_items.project_id
    AND properties.owner_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can read own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can read own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owners can read project passes" ON public.project_passes;
CREATE POLICY "Owners can read project passes"
ON public.project_passes
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Owners can insert tokens" ON public.project_view_tokens;
DROP POLICY IF EXISTS "Owners can select own tokens" ON public.project_view_tokens;
DROP POLICY IF EXISTS "Owners can delete own tokens" ON public.project_view_tokens;

CREATE POLICY "Owners can insert tokens" ON public.project_view_tokens FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

CREATE POLICY "Owners can select own tokens" ON public.project_view_tokens FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

CREATE POLICY "Owners can delete own tokens" ON public.project_view_tokens FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Owners can insert seller packets" ON public.seller_packets;
DROP POLICY IF EXISTS "Owners can select seller packets" ON public.seller_packets;
DROP POLICY IF EXISTS "Owners can update seller packets" ON public.seller_packets;

CREATE POLICY "Owners can insert seller packets" ON public.seller_packets FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

CREATE POLICY "Owners can select seller packets" ON public.seller_packets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

CREATE POLICY "Owners can update seller packets" ON public.seller_packets FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.properties pr ON p.property_id = pr.id
  WHERE p.id = project_id AND pr.owner_user_id = (select auth.uid())
));

DROP POLICY IF EXISTS documents_all_via_project ON public.documents;
CREATE POLICY documents_all_via_project ON public.documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE p.id = documents.project_id
    AND pr.owner_user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE p.id = documents.project_id
    AND pr.owner_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS invoices_all_via_project ON public.invoices;
CREATE POLICY invoices_all_via_project ON public.invoices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE p.id = invoices.project_id
    AND pr.owner_user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE p.id = invoices.project_id
    AND pr.owner_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS invoice_lines_via_invoice ON public.invoice_line_items;
CREATE POLICY invoice_lines_via_invoice ON public.invoice_line_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.projects p ON p.id = i.project_id
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE i.id = invoice_line_items.invoice_id
    AND pr.owner_user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.projects p ON p.id = i.project_id
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE i.id = invoice_line_items.invoice_id
    AND pr.owner_user_id = (select auth.uid())
  )
);

-- =============================================================================
-- Former 20260407150000_storage_hardening
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can manage project documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can manage project photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
);

-- =============================================================================
-- Former 20260408210000_backend_audit_hardening
-- =============================================================================

DROP POLICY IF EXISTS marketing_leads_insert_public ON public.marketing_leads;

CREATE TABLE IF NOT EXISTS public.revenuecat_webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Former 20260409120000_scope_items_ai_detail_columns
-- =============================================================================

ALTER TABLE public.scope_items
  ADD COLUMN IF NOT EXISTS confidence_reason text,
  ADD COLUMN IF NOT EXISTS justification text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS maintenance_tips text;

-- =============================================================================
-- Former 20260410000000_auto_updated_at_triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.scope_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.project_passes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.seller_packets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS on_projects_updated ON public.projects;
CREATE TRIGGER on_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_properties_updated ON public.properties;
CREATE TRIGGER on_properties_updated
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_scope_items_updated ON public.scope_items;
CREATE TRIGGER on_scope_items_updated
  BEFORE UPDATE ON public.scope_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_invoices_updated ON public.invoices;
CREATE TRIGGER on_invoices_updated
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_invoice_line_items_updated ON public.invoice_line_items;
CREATE TRIGGER on_invoice_line_items_updated
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_user_subscriptions_updated ON public.user_subscriptions;
CREATE TRIGGER on_user_subscriptions_updated
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_project_passes_updated ON public.project_passes;
CREATE TRIGGER on_project_passes_updated
  BEFORE UPDATE ON public.project_passes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_user_preferences_updated ON public.user_preferences;
CREATE TRIGGER on_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_seller_packets_updated ON public.seller_packets;
CREATE TRIGGER on_seller_packets_updated
  BEFORE UPDATE ON public.seller_packets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- Former 20260410010000_app_config
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to app_config"
  ON app_config FOR SELECT
  USING (true);

INSERT INTO app_config (key, value, description)
VALUES
  ('min_supported_mobile_version', '"1.0.0"', 'Minimum mobile version required to use the app.'),
  ('is_maintenance_mode', 'false', 'Global maintenance mode toggle.')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Former 20260412132118_revenuecat_entitlement_flag
-- =============================================================================

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS revenuecat_entitlement_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_subscriptions.revenuecat_entitlement_active IS
  'True when RevenueCat reports an active mobile store subscription for this user.';

-- =============================================================================
-- Former 20260412150000_onboarding_sync
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sync_token ON public.onboarding_sync(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_sync_expires ON public.onboarding_sync(expires_at);

ALTER TABLE public.onboarding_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a sync record" ON public.onboarding_sync
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- Former 20260415160000_onboarding_sync_secure_read
-- =============================================================================

DROP POLICY IF EXISTS "Anyone with token can read sync record" ON public.onboarding_sync;

CREATE OR REPLACE FUNCTION public.get_onboarding_sync_payload(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payload
  FROM public.onboarding_sync
  WHERE token = p_token
    AND expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_onboarding_sync_payload(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_onboarding_sync_payload(text) TO authenticated;

-- =============================================================================
-- Former 20260416103000_enable_rls_documents_invoices_lines
-- =============================================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
