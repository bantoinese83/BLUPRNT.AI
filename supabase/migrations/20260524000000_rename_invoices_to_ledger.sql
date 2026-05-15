-- Rename 'invoices' and 'invoice_line_items' to clarify they are part of a general project ledger
BEGIN;
-- 1. Rename the primary tables
ALTER TABLE public.invoices RENAME TO ledger_entries;
ALTER TABLE public.invoice_line_items RENAME TO ledger_line_items;
-- 2. Rename the foreign key column in the line items table
ALTER TABLE public.ledger_line_items RENAME COLUMN invoice_id TO ledger_entry_id;
-- 3. Update comments to reflect the new broader purpose
COMMENT ON TABLE public.ledger_entries IS 'The smart ledger for all project documents (Invoices, Receipts, Permits, HOA, etc).';
COMMENT ON TABLE public.ledger_line_items IS 'Individual line items extracted from ledger documents.';
COMMENT ON COLUMN public.ledger_line_items.ledger_entry_id IS 'Reference to the parent record in ledger_entries.';
COMMIT;
