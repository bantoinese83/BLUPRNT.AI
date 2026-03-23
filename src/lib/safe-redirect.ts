/**
 * Validates redirect URLs to prevent open redirect attacks.
 * Only allows relative paths (e.g. /dashboard, /settings).
 */
const SAFE_REDIRECT_PREFIXES = ["/dashboard", "/onboarding", "/settings", "/project"];

export function getSafeRedirect(redirect: string | null, fallback = "/dashboard"): string {
  if (!redirect || typeof redirect !== "string") return fallback;
  const trimmed = redirect.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return fallback;
  }
  if (trimmed.includes(":") || trimmed.includes("\\")) return fallback;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const allowed = SAFE_REDIRECT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  return allowed ? path : fallback;
}
