-- =============================================================================
-- Project Gallery (Multi-set Support)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after', 'progress')),
  storage_path text NOT NULL,
  caption text,
  uploaded_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_project_gallery_project_id ON public.project_gallery (project_id);
-- Enable RLS
ALTER TABLE public.project_gallery ENABLE ROW LEVEL SECURITY;
-- RLS Policy: Users can manage gallery items for projects they own
CREATE POLICY "Users can manage their project gallery"
ON public.project_gallery
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE p.id = project_gallery.project_id
    AND pr.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON p.property_id = pr.id
    WHERE p.id = project_gallery.project_id
    AND pr.owner_user_id = auth.uid()
  )
);
-- Update Storage Policy to be even more robust for the new table
DROP POLICY IF EXISTS "Users can manage project photos" ON storage.objects;
CREATE POLICY "Users can manage project photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    split_part(name, '/', 1) IN (
      SELECT p.id::text 
      FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'project-photos'
  AND (
    split_part(name, '/', 1) IN (
      SELECT p.id::text 
      FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
    )
  )
);
