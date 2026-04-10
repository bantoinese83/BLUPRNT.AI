import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { captureEdgeInvokeFailure } from "./sentry";
import type { Database } from "../../../shared/types/supabase.gen";

/**
 * AsyncStorage holds the full Supabase session (JWT + metadata). Expo SecureStore
 * caps values at ~2048 bytes, which breaks persisted sessions and spams warnings.
 */
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "BLUPRNT: Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in env.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: asyncStorageAdapter,
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function devWarn(...args: unknown[]) {
  if (__DEV__) {
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
      | FormData
      | Blob
      | ArrayBuffer
      | ReadableStream<Uint8Array>
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
