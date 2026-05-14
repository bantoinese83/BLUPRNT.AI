import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** UTF-8 byte equality resistant to timing leaks (same-length inputs only). */
export function timingSafeEqualUtf8(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) {
    diff |= ba[i]! ^ bb[i]!;
  }
  return diff === 0;
}

/**
 * True only when `Authorization` is exactly `Bearer ${serviceRoleKey}` (trimmed).
 * Never use substring matching on the service role key — that can false-positive
 * on crafted headers and is harder to reason about than strict equality.
 */
export function isBearerServiceRoleKey(
  authorizationHeader: string | null | undefined,
  serviceRoleKey: string | null | undefined,
): boolean {
  if (authorizationHeader == null || serviceRoleKey == null) return false;
  const key = serviceRoleKey.trim();
  if (!key) return false;
  const expected = `Bearer ${key}`;
  return timingSafeEqualUtf8(authorizationHeader.trim(), expected);
}

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase service configuration");
  return createClient(url, key);
}

export async function getUserIdFromRequest(
  req: Request,
): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7).trim();
  if (!jwt) return null;
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
    .select("id")
    .eq("id", projectId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("forbidden");
  }
}
