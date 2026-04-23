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
  const { data, error } = await admin
    .from("projects")
    .select("id, properties!inner(owner_user_id)")
    .eq("id", projectId)
    .eq("properties.owner_user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("forbidden");
  }
}
