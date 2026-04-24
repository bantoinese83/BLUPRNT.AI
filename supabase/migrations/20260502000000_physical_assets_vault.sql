-- Migration: Physical Assets Vault
-- Adds support for tracking physical renovation assets like paint, tiles, and fixtures.

CREATE TABLE IF NOT EXISTS public.physical_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL, -- 'Paint', 'Tile', 'Flooring', 'Fixture', 'Hardware', 'Other'
  brand text,
  color_name text,
  color_code text,
  finish text,
  location_in_home text,
  notes text,
  storage_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_physical_assets_project ON public.physical_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_physical_assets_category ON public.physical_assets(category);

-- RLS
ALTER TABLE public.physical_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_assets' AND policyname = 'Owners can manage physical assets') THEN
    CREATE POLICY "Owners can manage physical assets" ON public.physical_assets
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
        WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects p JOIN properties pr ON p.property_id = pr.id
        WHERE p.id = project_id AND pr.owner_user_id = auth.uid()
      ));
  END IF;
END $$;

-- Updated at trigger
DROP TRIGGER IF EXISTS on_physical_assets_updated ON public.physical_assets;
CREATE TRIGGER on_physical_assets_updated
  BEFORE UPDATE ON public.physical_assets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.physical_assets;
