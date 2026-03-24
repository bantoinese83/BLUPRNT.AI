import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Generate a shareable link for a project. Creates a token and returns the URL.
 */
export async function generateProjectShareLink(projectId: string): Promise<{
  ok: boolean;
  url?: string;
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "App isn't connected yet." };
  }

  const token =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : (() => {
          const bytes = new Uint8Array(16);
          if (
            typeof crypto !== "undefined" &&
            typeof crypto.getRandomValues === "function"
          ) {
            crypto.getRandomValues(bytes);
          } else {
            for (let i = 0; i < 16; i++)
              bytes[i] = Math.floor(Math.random() * 256);
          }
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex = [...bytes]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
        })();
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

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/project/${token}`;
  return { ok: true, url };
}
