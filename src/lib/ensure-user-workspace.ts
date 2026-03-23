import { supabase } from "@/lib/supabase";

/**
 * After OAuth or magic link, new users have no property/project. Create a starter workspace once.
 */
export async function ensureUserHasWorkspace(userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1);

  if (existing?.length) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("property_id", existing[0].id)
      .order("created_at", { ascending: false })
      .limit(1);
    const pid = projects?.[0]?.id;
    if (pid) {
      try {
        localStorage.setItem("blueprintai_project_id", pid);
      } catch {
        /* ignore */
      }
    }
    return;
  }

  const postal = "00000";
  const { data: prop, error: pErr } = await supabase
    .from("properties")
    .insert({
      owner_user_id: userId,
      postal_code: postal,
      city: "",
      state: "",
      country: "US",
    })
    .select("id")
    .single();

  if (pErr || !prop) return;

  const { data: proj, error: jErr } = await supabase
    .from("projects")
    .insert({
      property_id: prop.id,
      name: "My home project",
      type: "other",
      stage: "planning",
    })
    .select("id")
    .single();

  if (!jErr && proj?.id) {
    try {
      localStorage.setItem("blueprintai_project_id", proj.id);
    } catch {
      /* ignore */
    }
  }
}
