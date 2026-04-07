-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for project-documents
CREATE POLICY "Users can manage project documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    -- Allow if path starts with a project ID the user owns
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
);

-- 4. Storage Policies for project-photos
CREATE POLICY "Users can manage project photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties
      JOIN public.projects ON projects.property_id = properties.id
      WHERE properties.owner_user_id = auth.uid()
      AND projects.id::text = (storage.foldername(name))[1]
    )
  )
);
