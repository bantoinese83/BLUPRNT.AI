import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase.gen.ts";
import { type EdgeFunctionName, API_VERSIONS } from "./backend-routing.ts";

export type SupabaseClientConfig = {
  url: string;
  anonKey: string;
  storage?: {
    getItem: (key: string) => string | Promise<string | null> | null;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
  };
  detectSessionInUrl?: boolean;
  flowType?: "pkce" | "implicit";
};

/**
 * Shared factory for the Supabase client to ensure consistent configuration
 * (PKCE, session persistence, etc.) across web and mobile.
 */
export function createSupabaseClient(config: SupabaseClientConfig) {
  if (!config.url || !config.anonKey) {
    return createClient<Database>("", "", {
      auth: { persistSession: false },
    });
  }

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      storage: config.storage,
      flowType: config.flowType ?? "pkce",
      detectSessionInUrl: config.detectSessionInUrl ?? false,
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

/**
 * Shared retry logic for Edge Functions.
 * Ensures an API version header is sent and handles transient 5xx errors.
 * Note: The Supabase client automatically injects the Authorization header
 * from the active session.
 */
export async function invokeSharedFunction<T = unknown>(
  supabase: SupabaseClient<Database>,
  name: EdgeFunctionName | (string & {}), // Suggest known names but allow strings
  options?: {
    body?:
      | string
      | FormData
      | Blob
      | ArrayBuffer
      | ReadableStream<Uint8Array>
      | Record<string, unknown>;
    headers?: Record<string, string>;
    method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  },
  callbacks?: {
    onCaptureError?: (name: string, error: unknown) => void;
    onDevWarn?: (...args: unknown[]) => void;
  },
  retries = 2,
) {
  // Automatically inject our custom API versioning header
  const headers = {
    "x-bluprnt-api-version": API_VERSIONS.V2,
    ...options?.headers,
  };

  let lastResult: {
    data: T | null;
    error: { status?: number; message: string } | null;
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

      const status =
        lastResult.error && "status" in lastResult.error
          ? (lastResult.error as { status: number }).status
          : 0;

      if (status >= 500 && i < retries) {
        const delay = Math.pow(2, i) * 1000;
        callbacks?.onDevWarn?.(
          `[invokeFunction] ${name} failed with ${status}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (lastResult.error) {
        callbacks?.onCaptureError?.(name, lastResult.error);
      }
      return lastResult;
    } catch (err) {
      const error = err as Error;
      lastResult = {
        data: null,
        error: { status: 0, message: error.message || "Unknown error" },
      };
      if (i < retries) {
        const delay = Math.pow(2, i) * 1000;
        callbacks?.onDevWarn?.(
          `[invokeFunction] ${name} threw error. Retrying in ${delay}ms...`,
          err,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (lastResult.error) {
    callbacks?.onCaptureError?.(name, lastResult.error);
  }
  return lastResult;
}
