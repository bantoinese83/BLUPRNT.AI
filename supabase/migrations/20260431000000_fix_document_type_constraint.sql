-- =============================================================================
-- Fix Document Type Constraint
--
-- Ensures all supported document types in shared/lib/infer-document-type.ts 
-- are allowed by the database check constraint.
-- =============================================================================

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents 
  ADD CONSTRAINT documents_type_check 
  CHECK (type IN (
    'invoice', 
    'quote', 
    'receipt', 
    'permit', 
    'hoa', 
    'warranty', 
    'maintenance', 
    'manual', 
    'insurance', 
    'disclosure', 
    'inspection', 
    'appraisal', 
    'energy', 
    'contract', 
    'lien_waiver', 
    'other'
  ));

COMMENT ON CONSTRAINT documents_type_check ON public.documents IS 
  'Enforces valid document types as defined in the shared application logic.';
