-- Add source column to scope_items to track Vison vs Text-only mode
ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'text';

-- Update any existing rows that might missing it
UPDATE scope_items SET source = 'text' WHERE source IS NULL;
