import { captureEdgeInvokeFailure } from "@/lib/sentry";

import {
  createSupabaseClient,
  invokeSharedFunction,
} from "@bluprnt/shared/lib/supabase-client";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "BlueprintAI: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
  );
}

export const supabase = createSupabaseClient({
  url: url ?? "",
  anonKey: anonKey ?? "",
  flowType: "pkce",
  detectSessionInUrl: true,
});

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

declare global {
  interface Window {
    supabase?: typeof supabase;
  }
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
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
  return invokeSharedFunction<T>(
    supabase,
    name,
    options,
    {
      onCaptureError: captureEdgeInvokeFailure,
      onDevWarn: devWarn,
    },
    retries,
  );
}
