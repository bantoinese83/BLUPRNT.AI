import * as Linking from "expo-linking";

/**
 * Supabase password recovery redirect. Must match an entry in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs (e.g. `ai.bluprnt.mobile://**`).
 */
export function getPasswordRecoveryRedirectUrl(): string {
  return Linking.createURL("/reset-password");
}

/**
 * PKCE email links and OAuth returns often include `?code=…` on the deep link URL.
 */
export function extractPkceCodeFromUrl(url: string): string | null {
  const { queryParams } = Linking.parse(url);
  const raw = queryParams?.code;
  const fromQuery =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;
  if (fromQuery) return fromQuery;

  const hashIdx = url.indexOf("#");
  if (hashIdx === -1) return null;
  try {
    const hash = url.slice(hashIdx + 1);
    const params = new URLSearchParams(hash);
    return params.get("code");
  } catch {
    return null;
  }
}
