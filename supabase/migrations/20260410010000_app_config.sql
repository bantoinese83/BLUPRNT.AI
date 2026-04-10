/**
 * Global App Configuration for mobile and web
 */
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read app config (needed for pre-auth version checks)
CREATE POLICY "Allow public read-only access to app_config"
  ON app_config FOR SELECT
  USING (true);

-- Seeding initial values
INSERT INTO app_config (key, value, description)
VALUES 
  ('min_supported_mobile_version', '"1.0.0"', 'Minimum mobile version required to use the app.'),
  ('is_maintenance_mode', 'false', 'Global maintenance mode toggle.')
ON CONFLICT (key) DO NOTHING;
