-- Fix: security_hardening (20260427191807) overwrote the production URL
-- with a local Docker address, silently breaking the pg_net trigger that
-- dispatches document OCR processing.
CREATE OR REPLACE FUNCTION public.get_system_config(config_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF config_key = 'edge_functions_base_url' THEN
    RETURN 'https://elucgaegaihkklnfoasm.supabase.co/functions/v1';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = public;
