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
        console.warn(
          `[invokeFunction] ${name} failed with ${status}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return lastResult;
    } catch (err) {
      lastResult = { data: null, error: err as Error };
      if (i < retries) {
        const delay = Math.pow(2, i) * 1000;
        console.warn(
          `[invokeFunction] ${name} threw error. Retrying in ${delay}ms...`,
          err,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return lastResult;
}
