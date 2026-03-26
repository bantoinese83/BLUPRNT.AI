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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
