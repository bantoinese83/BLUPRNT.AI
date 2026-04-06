-- Applied via Supabase MCP advisors (security + performance initplan).
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Remove redundant permissive policies that duplicate the "Users can manage ..." family
DROP POLICY IF EXISTS projects_all_via_property ON public.projects;
DROP POLICY IF EXISTS scope_items_all_via_project ON public.scope_items;

-- Replace hot-path policies using (select auth.uid()) / (select auth.jwt()) for stable plans
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

-- Documents / invoices / line items: recreate single policy each with initplan-safe auth
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
