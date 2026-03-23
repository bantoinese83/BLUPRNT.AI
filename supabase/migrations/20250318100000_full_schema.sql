-- Full schema: project_view_tokens, invoice mapping, document types, budget, seller packets

-- 1. Project view tokens (if not exists)
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

-- 2. Invoice line item -> scope item mapping
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS scope_item_id uuid REFERENCES scope_items(id) ON DELETE SET NULL;

-- 3. Documents: type column supports invoice, quote, warranty, permit (no constraint to avoid conflicts)

-- 4. Seller packets table
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

-- 5. Projects: ensure updated_at exists for scope recalc
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 6. Invoice line items: ensure RLS allows project owners to update scope_item_id
-- (If invoice_line_items has RLS, add policy for UPDATE by project owner)
