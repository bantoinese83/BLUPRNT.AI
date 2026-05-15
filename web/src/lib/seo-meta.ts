/**
 * Shared SEO constants and helpers (canonical URLs, robots directives, OG defaults).
 */

import { getPublicSiteUrl } from "@/lib/site-url";

import { PUBLIC_SITE_ORIGIN } from "@shared/constants/public-site";

const SEO_FALLBACK_ORIGIN = PUBLIC_SITE_ORIGIN;

export const SITE_NAME = "BLUPRNT";
const SITE_NAME_FULL = "BLUPRNT.AI";

/** Default social preview image (1200×630 PNG in /public). */
export const DEFAULT_OG_IMAGE_PATH = "/og-image.png";

export const LANDING_PAGE_TITLE =
  "Home Renovation Cost Estimator & Remodel Budget Tracker | BLUPRNT.AI";

export const LANDING_PAGE_DESCRIPTION =
  "Regional remodel cost ranges, plan vs documented spend from your invoices and quotes, and a seller-ready property ledger—built for homeowners, not contractor CRMs.";

export const LANDING_KEYWORDS =
  "home renovation cost estimator, remodel budget tracker, kitchen remodel cost, bathroom remodel cost, home improvement record, property ledger, AI renovation planner, renovation cost estimator, home remodel budget, invoice tracking, seller packet";

/** Public marketing and legal pages. */
export const META_ROBOTS_INDEX =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

/** App, auth, and transactional routes — avoid diluting branded search with utility URLs. */
export const META_ROBOTS_NOINDEX = "noindex, nofollow";

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
 * Absolute URL for a path (e.g. `/login` → `https://bluprnt.ai/login`).
 */
export function seoAbsoluteUrl(path: string): string {
  const base = seoCanonicalOrigin().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function seoOgImageUrl(
  imagePath: string = DEFAULT_OG_IMAGE_PATH,
): string {
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return seoAbsoluteUrl(path);
}

export function seoPageTitle(
  pageTitle: string,
  options?: { includeBrand?: boolean },
): string {
  const includeBrand = options?.includeBrand !== false;
  if (!includeBrand) return pageTitle;
  if (pageTitle.includes(SITE_NAME)) return pageTitle;
  return `${pageTitle} — ${SITE_NAME_FULL}`;
}
