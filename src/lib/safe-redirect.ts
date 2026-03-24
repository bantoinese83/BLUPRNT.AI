/**
 * Validates redirect URLs to prevent open redirect attacks.
 * Only allows relative paths (e.g. /dashboard, /settings).
 * Query strings are allowed when the path (without ?/#) matches a safe prefix
 * (e.g. /dashboard?session_id=… after Stripe checkout).
 */
const SAFE_REDIRECT_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/settings",
  "/project",
];

function pathOnlySegment(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? path;
}

export function getSafeRedirect(
  redirect: string | null,
  fallback = "/dashboard",
): string {
  if (!redirect || typeof redirect !== "string") return fallback;
  const trimmed = redirect.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return fallback;
  }
  if (trimmed.includes(":") || trimmed.includes("\\")) return fallback;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const base = pathOnlySegment(path);
  if (base.includes("..")) return fallback;
  const allowed = SAFE_REDIRECT_PREFIXES.some(
    (p) => base === p || base.startsWith(`${p}/`),
  );
  return allowed ? path : fallback;
}
