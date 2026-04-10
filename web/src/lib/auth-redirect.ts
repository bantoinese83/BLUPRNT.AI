/**
 * Must match entries in Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthCallbackUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (envUrl) return `${envUrl}/auth/callback`;
  if (typeof window !== "undefined")
    return `${window.location.origin}/auth/callback`;
  return "http://localhost:3000/auth/callback";
}
