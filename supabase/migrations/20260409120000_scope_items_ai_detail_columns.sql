-- PostgREST / mobile insert expects these columns (see src/types/supabase.gen.ts).
-- Safe re-run: IF NOT EXISTS.
ALTER TABLE public.scope_items
  ADD COLUMN IF NOT EXISTS confidence_reason text,
  ADD COLUMN IF NOT EXISTS justification text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS maintenance_tips text;
