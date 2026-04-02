-- Migration: Cross-platform active project tracking
-- Stores the last project a user viewed so that switching between
-- web and mobile doesn't break their mental context.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own preferences
CREATE POLICY "user_preferences_self"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
