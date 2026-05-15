-- Deferred from 20260427191807: tables are created in later migrations.

-- project_gallery (20260434000000)
ALTER TABLE public.project_gallery ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
UPDATE public.project_gallery pg
SET owner_user_id = pr.owner_user_id
FROM public.projects p
JOIN public.properties pr ON p.property_id = pr.id
WHERE pg.project_id = p.id AND pg.owner_user_id IS NULL;
CREATE OR REPLACE TRIGGER on_project_gallery_insert_sync_owner
  BEFORE INSERT OR UPDATE OF project_id, owner_user_id ON public.project_gallery
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_owner_sync();
DROP POLICY IF EXISTS "Users can manage their project gallery" ON public.project_gallery;
CREATE POLICY "Users can manage their project gallery"
ON public.project_gallery
FOR ALL
TO authenticated
USING (owner_user_id = (SELECT auth.uid()))
WITH CHECK (owner_user_id = (SELECT auth.uid()));

-- physical_assets (20260502000000)
ALTER TABLE public.physical_assets ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
UPDATE public.physical_assets pa
SET owner_user_id = pr.owner_user_id
FROM public.projects p
JOIN public.properties pr ON p.property_id = pr.id
WHERE pa.project_id = p.id AND pa.owner_user_id IS NULL;
CREATE OR REPLACE TRIGGER on_physical_assets_insert_sync_owner
  BEFORE INSERT OR UPDATE OF project_id, owner_user_id ON public.physical_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_owner_sync();
DROP POLICY IF EXISTS "Owners can manage physical assets" ON public.physical_assets;
CREATE POLICY "Owners can manage physical assets"
ON public.physical_assets
FOR ALL
TO authenticated
USING (owner_user_id = (SELECT auth.uid()))
WITH CHECK (owner_user_id = (SELECT auth.uid()));
