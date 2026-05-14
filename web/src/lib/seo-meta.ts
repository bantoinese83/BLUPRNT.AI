/**
 * Shared SEO constants and helpers (canonical URLs, robots directives).
 */

import { getPublicSiteUrl } from "@/lib/site-url";

import { PUBLIC_SITE_ORIGIN } from "@shared/constants/public-site";

const SEO_FALLBACK_ORIGIN = PUBLIC_SITE_ORIGIN;

/**
 * Stable origin for canonical and absolute OG URLs. Prefer VITE_SITE_URL in production.
 */
export function seoCanonicalOrigin(): string {
  const env = getPublicSiteUrl();
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return SEO_FALLBACK_ORIGIN;
}

/**
 * Absolute URL for a path (e.g. `/login` → `https://bluprntai.com/login`).
 */
export function seoAbsoluteUrl(path: string): string {
  const base = seoCanonicalOrigin().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** App, auth, and transactional routes — avoid diluting branded search with utility URLs. */
export const META_ROBOTS_NOINDEX = "noindex, nofollow";
