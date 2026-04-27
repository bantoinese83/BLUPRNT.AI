-- Add ai_summary column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ai_summary text;

COMMENT ON COLUMN public.invoices.ai_summary IS 'AI-generated concise summary of the document contents.';
