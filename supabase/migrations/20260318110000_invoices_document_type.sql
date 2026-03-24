-- Add document_type to invoices so quotes, warranties, permits appear in the main list
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'invoice';

-- Backfill existing rows
UPDATE invoices SET document_type = 'invoice' WHERE document_type IS NULL;
