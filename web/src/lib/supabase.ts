import { createClient } from "@supabase/supabase-js";
import { captureEdgeInvokeFailure } from "@/lib/sentry";
import type { Database } from "@shared/types/supabase.gen";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "BlueprintAI: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
  );
}

export const supabase = createClient<Database>(url ?? "", anonKey ?? "", {
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

declare global {
  interface Window {
    supabase?: typeof supabase;
  }
}

if (typeof window !== "undefined") {
  window.supabase = supabase;
}

function devWarn(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}

/**
 * Robust wrapper for Edge Functions that ensures a fresh JWT is sent.
 * Use this instead of supabase.functions.invoke() to avoid 'Invalid JWT' errors.
 */
export async function invokeFunction<T = unknown>(
  name: string,
  options?: {
    body?:
      | string
      | File
      | Blob
      | ArrayBuffer
      | FormData
      | Record<string, unknown>;
    headers?: Record<string, string>;
    method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  },
  retries = 2,
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

  let lastResult: {
    data: T | null;
    error: { status: number; message: string } | Error | null;
  } = { data: null, error: null };

  for (let i = 0; i <= retries; i++) {
    try {
      lastResult = await supabase.functions.invoke<T>(name, {
        ...options,
        headers,
      });

      if (!lastResult.error) {
        return lastResult;
      }

      // Retry on 5xx errors
      const status =
        lastResult.error && "status" in lastResult.error
          ? (lastResult.error as { status: number }).status
          : 0;
      if (status >= 500 && i < retries) {
        const delay = Math.pow(2, i) * 1000;
        devWarn(
          `[invokeFunction] ${name} failed with ${status}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (lastResult.error) {
        captureEdgeInvokeFailure(name, lastResult.error);
      }
      return lastResult;
    } catch (err) {
      lastResult = { data: null, error: err as Error };
      if (i < retries) {
        const delay = Math.pow(2, i) * 1000;
        devWarn(
          `[invokeFunction] ${name} threw error. Retrying in ${delay}ms...`,
          err,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (lastResult.error) {
    captureEdgeInvokeFailure(name, lastResult.error);
  }
  return lastResult;
}
