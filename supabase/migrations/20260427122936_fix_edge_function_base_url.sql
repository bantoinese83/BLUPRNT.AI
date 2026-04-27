-- Correct the hardcoded local Docker URL to the real Supabase project URL
-- This ensures that database triggers (webhooks) can correctly reach the Edge Functions in production.

CREATE OR REPLACE FUNCTION public.get_system_config(config_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF config_key = 'edge_functions_base_url' THEN
    -- In a real production environment, this should ideally be an environment variable or table entry.
    -- For now, we point to the project elucgaegaihkklnfoasm.
    RETURN 'https://elucgaegaihkklnfoasm.supabase.co/functions/v1';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
