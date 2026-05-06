-- Gallery uploads use the service role; viewing uses the Supabase client createSignedUrls,
-- which requires SELECT on storage.objects. If only the bucket was created (no policies),
-- signed URL generation fails and before/after images never load in the app.

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
