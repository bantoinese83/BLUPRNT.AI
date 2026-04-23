-- =============================================================================
-- Fix Storage RLS Policies
-- 
-- The previous policies used `storage.foldername(name)[1]` which can be 
-- unreliable depending on path formatting. Switching to `split_part`
-- and ensuring both project-documents and project-photos are robust.
-- =============================================================================

-- 1. project-documents
DROP POLICY IF EXISTS "Users can manage project documents" ON storage.objects;

CREATE POLICY "Users can manage project documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
      AND p.id::text = split_part(name, '/', 1)
    )
  )
)
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
      AND p.id::text = split_part(name, '/', 1)
    )
  )
);

-- 2. project-photos
DROP POLICY IF EXISTS "Users can manage project photos" ON storage.objects;

CREATE POLICY "Users can manage project photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
      AND p.id::text = split_part(name, '/', 1)
    )
  )
)
WITH CHECK (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE pr.owner_user_id = auth.uid()
      AND p.id::text = split_part(name, '/', 1)
    )
  )
);

-- 3. project-view-tokens (for shared views) - if applicable, but usually tokens are for reading.
-- We keep them as is for now unless they cause issues.
