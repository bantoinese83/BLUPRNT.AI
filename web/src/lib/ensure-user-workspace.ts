import { supabase } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";

/**
 * After OAuth or magic link, new users have no property/project. Create a starter workspace once.
 */
export async function ensureUserHasWorkspace(userId: string): Promise<void> {
  const { data: existing, error: existErr } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1);

  if (existErr) {
    reportClientError("ensure_workspace_properties_query", existErr);
    return;
  }

  if (existing?.length) {
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("property_id", existing[0].id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (projErr) {
      reportClientError("ensure_workspace_projects_query", projErr);
      return;
    }

    const pid = projects?.[0]?.id;
    if (pid) {
      try {
        localStorage.setItem("bluprnt_project_id", pid);
      } catch {
        /* ignore */
      }
      return;
    }

    // Property exists but no project, fall through to project creation
    const { data: proj, error: jErr } = await supabase
      .from("projects")
      .insert({
        property_id: existing[0].id,
        name: "My home project",
        type: "other",
        stage: "planning",
      })
      .select("id")
      .single();

    if (jErr) {
      reportClientError("ensure_workspace_project_insert", jErr);
      return;
    }

    if (proj?.id) {
      try {
        localStorage.setItem("bluprnt_project_id", proj.id);
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

  if (pErr || !prop) {
    reportClientError(
      "ensure_workspace_property_insert",
      pErr ?? new Error("missing property row"),
    );
    return;
  }

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

  if (jErr) {
    reportClientError("ensure_workspace_project_insert_new_property", jErr);
    return;
  }

  if (proj?.id) {
    try {
      localStorage.setItem("bluprnt_project_id", proj.id);
    } catch {
      /* ignore */
    }
  }
}
