import { Alert, Share } from "react-native";
import { randomUUID } from "expo-crypto";
import { supabase } from "@/lib/supabase";
import { friendlyProjectShareError } from "@shared/lib/user-friendly-errors";

function shareLinkBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return raw && raw.startsWith("http") ? raw : "https://bluprnt.ai";
}

/**
 * Generate a shareable link for a project. Creates a token and returns the URL.
 */
export async function generateProjectShareLink(projectId: string): Promise<{
  ok: boolean;
  url?: string;
  message?: string;
  code?: string;
}> {
  const token = randomUUID();

  const { error } = await supabase.from("project_view_tokens").insert({
    project_id: projectId,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Couldn't create share link.",
      code: error.code,
    };
  }

  const base = shareLinkBaseUrl();
  const url = `${base}/project/${token}`;
  return { ok: true, url };
}

/**
 * Opens the system share sheet with a time-limited view link (same behavior as web).
 */
export async function presentProjectShareSheet(project: {
  id: string;
  name: string;
}): Promise<void> {
  try {
    const res = await generateProjectShareLink(project.id);
    if (res.ok && res.url) {
      await Share.share({
        message: `View my project “${project.name}” on BLUPRNT (read-only link):\n\n${res.url}`,
        url: res.url,
        title: project.name,
      });
    } else {
      Alert.alert(
        "Couldn’t share",
        friendlyProjectShareError(res.message, res.code),
      );
    }
  } catch (err) {
    console.error("Share error:", err);
    Alert.alert(
      "Couldn’t share",
      friendlyProjectShareError(err instanceof Error ? err.message : undefined),
    );
  }
}
