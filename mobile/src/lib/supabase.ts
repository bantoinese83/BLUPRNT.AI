import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { captureEdgeInvokeFailure } from "@/lib/sentry";

/**
 * AsyncStorage holds the full Supabase session (JWT + metadata). Expo SecureStore
 * caps values at ~2048 bytes, which breaks persisted sessions and spams warnings.
 */
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

import {
  createSupabaseClient,
  invokeSharedFunction,
} from "@shared/lib/supabase-client";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "BLUPRNT: Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in env.",
  );
}

export const supabase = createSupabaseClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  storage: asyncStorageAdapter,
  flowType: "pkce",
  detectSessionInUrl: false,
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
