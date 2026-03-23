import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase service configuration");
  return createClient(url, key);
}

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const supabase = createClient(url, anon);
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  if (error || !user) return null;
  return user.id;
}

export async function assertProjectOwner(
  admin: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<void> {
  const { data: project, error: e1 } = await admin
    .from("projects")
    .select("property_id")
    .eq("id", projectId)
    .single();
  if (e1 || !project) throw new Error("not_found");
  const { data: prop, error: e2 } = await admin
    .from("properties")
    .select("owner_user_id")
    .eq("id", project.property_id)
    .single();
  if (e2 || !prop || prop.owner_user_id !== userId) throw new Error("forbidden");
}
