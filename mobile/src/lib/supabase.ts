import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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
