-- Project view tokens for shareable links (run in Supabase SQL editor if not using migrations)
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

-- Owners can manage tokens for their projects
CREATE POLICY "Owners can insert tokens"
  ON project_view_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can select own tokens"
  ON project_view_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    )
  );

-- Owners can delete their tokens
CREATE POLICY "Owners can delete own tokens"
  ON project_view_tokens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
    )
  );

COMMENT ON TABLE project_view_tokens IS 'Shareable tokens for contractor/external project view. Use get-project-view edge function to fetch by token.';
