-- Enable pg_net extension to support the welcome email webhook
-- and other future HTTP-based triggers.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- Grant usage to the net schema if needed (pg_net creates this)
-- NOTE: pg_net creates its own 'net' schema.;
