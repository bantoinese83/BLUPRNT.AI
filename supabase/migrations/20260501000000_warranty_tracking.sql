-- Migration: Add warranty tracking to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS warranty_expiry_date date,
  ADD COLUMN IF NOT EXISTS warranty_notified_at timestamptz;

-- Index for expiration checks
CREATE INDEX IF NOT EXISTS idx_invoices_warranty_expiry ON public.invoices (warranty_expiry_date)
  WHERE warranty_expiry_date IS NOT NULL;

COMMENT ON COLUMN public.invoices.warranty_expiry_date IS 'Optional date when the product or service warranty expires.';
COMMENT ON COLUMN public.invoices.warranty_notified_at IS 'Timestamp when the user was last notified about this warranty expiration.';
