-- Phase 3: Semantic Search (pgvector)

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Document Embeddings Table
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- The text representation of the invoice/document
  embedding vector(768) NOT NULL, -- Assuming Gemini models/text-embedding-004
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for embeddings with robust join fallback
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own embeddings" ON public.document_embeddings;
DROP POLICY IF EXISTS "embeddings_access_policy" ON public.document_embeddings;
CREATE POLICY "embeddings_access_policy"
  ON public.document_embeddings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = (SELECT auth.uid())
    )
  );

-- 3. HNSW Index for Performance
CREATE INDEX ON public.document_embeddings USING hnsw (embedding vector_cosine_ops);

-- 4. Similarity Search Function
CREATE OR REPLACE FUNCTION public.match_document_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM public.document_embeddings de
  WHERE de.project_id = p_project_id
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
