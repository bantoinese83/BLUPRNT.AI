-- =============================================================================
-- Enable Realtime replication for core project data.
-- Allows Web and Mobile to stay in sync without manual refreshes.
-- =============================================================================

-- 1. Create the publication if it doesn't exist (Supabase default is usually 'supabase_realtime')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE scope_items;

-- 3. Ensure tables have REPLICA IDENTITY FULL if we want to track specific field changes easily
-- (Optional, DEFAULT is usually enough for simple invalidations)
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE scope_items REPLICA IDENTITY FULL;
