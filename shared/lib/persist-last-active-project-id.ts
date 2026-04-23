import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

/**
 * Syncs the user's chosen project to `user_preferences` (web + mobile).
 */
export async function persistLastActiveProjectId(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: userId,
    last_active_project_id: projectId,
    updated_at: new Date().toISOString(),
  });
  return { error };
}
