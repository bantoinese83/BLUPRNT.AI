-- Add archiving support to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Add completion status to scope items
ALTER TABLE public.scope_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'completed'));

-- Ensure user_preferences has a column for general UI preferences (theme, etc)
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS ui_preferences jsonb DEFAULT '{"theme": "system", "compact_view": false}'::jsonb;

-- Update comments
COMMENT ON COLUMN public.projects.archived IS 'Whether the project is hidden from the main active dashboard.';
COMMENT ON COLUMN public.scope_items.status IS 'Completion status of the scope item for progress tracking.';
COMMENT ON COLUMN public.user_preferences.ui_preferences IS 'User-specific UI settings like theme and layout choices.';
