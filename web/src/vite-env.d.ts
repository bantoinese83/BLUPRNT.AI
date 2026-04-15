/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Optional: production site URL for OAuth/magic-link redirects (defaults to window.location.origin) */
  readonly VITE_SITE_URL?: string;
  /** Stripe Architect subscription price ID */
  readonly VITE_STRIPE_ARCHITECT_PRICE_ID?: string;
  /** Stripe Project Pass one-time price ID */
  readonly VITE_STRIPE_PROJECT_PASS_PRICE_ID?: string;
  /** Sentry browser DSN (optional) */
  readonly VITE_SENTRY_DSN?: string;
  /** Set to "1" in E2E / automation to expose probe routes */
  readonly VITE_E2E?: string;
  /** Injected from `web/package.json` at build time (semver gate vs `app_config`). */
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
