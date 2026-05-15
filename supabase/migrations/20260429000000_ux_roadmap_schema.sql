-- =============================================================================
-- UX Roadmap Schema Updates
--
-- 1. The Home Team: derive from invoices, but add contact_info for better storage.
-- 2. Transformation Slider: track before/after photo paths on project.
-- 3. Warranty Countdown: track expiry date on high-value documents.
-- =============================================================================

-- 1. Contractor / Home Team enhancements
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS vendor_contact_info jsonb DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.invoices.vendor_contact_info IS 
  'Stores extracted contact info (phone, email, website) for "The Home Team" directory.';
-- 2. Transformation Slider (Before/After)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS before_photo_storage_path text,
  ADD COLUMN IF NOT EXISTS after_photo_storage_path text;
COMMENT ON COLUMN public.projects.before_photo_storage_path IS 
  'Path in project-photos bucket for the initial state image.';
COMMENT ON COLUMN public.projects.after_photo_storage_path IS 
  'Path in project-photos bucket for the current/final state image.';
-- 3. Warranty Countdown
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS warranty_expiry_date date;
CREATE INDEX IF NOT EXISTS idx_invoices_warranty_expiry ON public.invoices(warranty_expiry_date)
  WHERE warranty_expiry_date IS NOT NULL;
COMMENT ON COLUMN public.invoices.warranty_expiry_date IS 
  'Date when the warranty for this item expires, used for dashboard countdowns.';
