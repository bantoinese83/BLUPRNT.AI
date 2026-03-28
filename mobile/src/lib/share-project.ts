import { supabase } from "./supabase";

/**
 * Generate a shareable link for a project. Creates a token and returns the URL.
 */
export async function generateProjectShareLink(projectId: string): Promise<{
  ok: boolean;
  url?: string;
  message?: string;
}> {
  // Simple UUID generator for mobile environment
  const token = Array.from({ length: 32 }, (_, i) => {
    const r = (Math.random() * 16) | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20)
      return "-" + r.toString(16);
    return r.toString(16);
  }).join("");

  const { error } = await supabase.from("project_view_tokens").insert({
    project_id: projectId,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Couldn't create share link.",
    };
  }

  // Use the web production URL for the shared view
  const base = "https://bluprnt.ai";
  const url = `${base}/project/${token}`;
  return { ok: true, url };
}
