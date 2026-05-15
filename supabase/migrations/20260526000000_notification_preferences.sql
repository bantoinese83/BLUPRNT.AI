-- Add notification_preferences column to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"budget_alerts": true, "ocr_completion": true, "marketing": false, "preferred_channel": "email"}'::jsonb;

COMMENT ON COLUMN public.user_preferences.notification_preferences IS
  'Granular notification controls including budget alerts, OCR completion, marketing opt-ins, and preferred delivery channel.';
