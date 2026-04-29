import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSafeRedirect } from "@shared/lib/safe-redirect";

const KEY = "bluprnt_post_login_redirect";

/**
 * OAuth / Apple flows do not preserve Expo `?redirect=` after the browser closes.
 * Call before starting social sign-in so {@link consumePostLoginRedirect} can apply it.
 */
export async function persistPostLoginRedirectForOAuth(
  redirect: string | string[] | undefined,
): Promise<void> {
  const raw = Array.isArray(redirect) ? redirect[0] : redirect;
  if (!raw?.trim()) return;
  const safe = getSafeRedirect(raw.trim(), "/(tabs)");
  await AsyncStorage.setItem(KEY, safe);
}

/** Merge stored OAuth redirect with password-login fallback (draft vs tabs). */
export async function consumePostLoginRedirect(
  fallback: string,
): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (!stored) return fallback;
    await AsyncStorage.removeItem(KEY);
    return getSafeRedirect(stored, fallback);
  } catch {
    return fallback;
  }
}

/** Drop any pending OAuth redirect (e.g. before password sign-in succeeds). */
export async function clearPostLoginRedirectStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
