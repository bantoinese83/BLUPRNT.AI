-- Marketing Leads for exit intent capture
CREATE TABLE IF NOT EXISTS marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'web',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so users can submit the lead modal without being logged in)
-- Actually, the lead capture modal is shown inside the dashboard where user IS logged in.
-- But we'll allow public just in case.
DO $$ BEGIN
  CREATE POLICY "Public can insert leads" ON marketing_leads FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins/owners should be able to read leads (or we leave it restricted)
DO $$ BEGIN
  CREATE POLICY "Service role can select leads" ON marketing_leads FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
