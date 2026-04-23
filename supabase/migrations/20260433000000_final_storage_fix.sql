-- =============================================================================
-- Force Fix Storage RLS and Bucket Setup
-- =============================================================================

-- Ensure bucket exists and has RLS enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-photos', 'project-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- 1. project-photos (Robust policy)
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

-- 2. project-documents (Consistent policy)
DROP POLICY IF EXISTS "Users can manage project documents" ON storage.objects;

CREATE POLICY "Users can manage project documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-documents'
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
  bucket_id = 'project-documents'
  AND (
    split_part(name, '/', 1) IN (
      SELECT p.id::text 
      FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
    )
  )
);
