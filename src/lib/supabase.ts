import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "BlueprintAI: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Robust wrapper for Edge Functions that ensures a fresh JWT is sent.
 * Use this instead of supabase.functions.invoke() to avoid 'Invalid JWT' errors.
 */
export async function invokeFunction<T = any>(
  name: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
    method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  },
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    ...options?.headers,
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };

  return supabase.functions.invoke<T>(name, {
    ...options,
    headers,
  });
}
