-- Table for short-lived anonymous handoff of onboarding drafts across devices.
-- This allows a user to start on mobile (take photos) and finish on web.

CREATE TABLE IF NOT EXISTS public.onboarding_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at timestamptz DEFAULT now()
);

-- Index for lookup by token
CREATE INDEX IF NOT EXISTS idx_onboarding_sync_token ON public.onboarding_sync(token);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_onboarding_sync_expires ON public.onboarding_sync(expires_at);

-- RLS: Anyone can insert (anonymous) and anyone can read if they have the token.
-- No updates or deletes allowed (cleanup via cron or service role).
ALTER TABLE public.onboarding_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a sync record" ON public.onboarding_sync
  FOR INSERT WITH CHECK (true);

-- No broad SELECT: clients use get_onboarding_sync_payload(token); see
-- 20260415160000_onboarding_sync_secure_read.sql.

-- Add a cron job or similar to cleanup expired records (optional, but good practice).
-- For now, we'll assume manual/periodic cleanup.
