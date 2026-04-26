-- Phase 2: Asynchronous Processing & Reliability

-- 1. Asynchronous OCR Queue
CREATE TABLE IF NOT EXISTS public.document_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for queue with robust join fallback
ALTER TABLE public.document_processing_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own queue items" ON public.document_processing_queue;
DROP POLICY IF EXISTS "queue_access_policy" ON public.document_processing_queue;
CREATE POLICY "queue_access_policy"
  ON public.document_processing_queue FOR SELECT
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON p.property_id = pr.id
      WHERE p.id = project_id AND pr.owner_user_id = (SELECT auth.uid())
    )
  );

-- Trigger to process queue via Edge Function
CREATE OR REPLACE FUNCTION public.handle_document_queue_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := public.get_system_config('edge_functions_base_url') || '/process-document-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'queue_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_document_queue_inserted
  AFTER INSERT ON public.document_processing_queue
  FOR EACH ROW EXECUTE FUNCTION public.handle_document_queue_insert();

-- 2. Daily Subscription Reconciliation Cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reconciliation job to run every day at 2 AM
SELECT cron.schedule(
  'daily-subscription-reconciliation',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := public.get_system_config('edge_functions_base_url') || '/check-subscription-status',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
