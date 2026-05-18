/**
 * Canonical marketing URLs (mobile opens in browser) and matching in-app paths (web router).
 */
/** Canonical marketing origin (Vercel production host). */
export const PUBLIC_SITE_ORIGIN = "https://www.bluprntai.com" as const;

export const PUBLIC_PRIVACY_POLICY_URL =
  `${PUBLIC_SITE_ORIGIN}/privacy` as const;

export const PUBLIC_TERMS_OF_SERVICE_URL =
  `${PUBLIC_SITE_ORIGIN}/terms` as const;

export const PUBLIC_SUPPORT_PAGE_URL = `${PUBLIC_SITE_ORIGIN}/support` as const;

/** Primary contact for support surfaces (same inbox as product “Contact” links). */
export const PUBLIC_SUPPORT_EMAIL = "connect@monarch-labs.com" as const;

/** Web `BrowserRouter` paths — same slugs as the public site. */
export const WEB_APP_PATH_PRIVACY = "/privacy" as const;
export const WEB_APP_PATH_TERMS = "/terms" as const;
export const WEB_APP_PATH_SUPPORT = "/support" as const;
