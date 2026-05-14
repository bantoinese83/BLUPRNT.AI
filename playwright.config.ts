import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Web E2E runs against preview with placeholder Supabase env unless you export real
 * values. Deep billing flows (`e2e/billing-upgrade.spec.ts`) skip unless
 * `VITE_SUPABASE_URL` points at localhost (e.g. after `supabase start`).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    /** CI: keep traces for failed attempts so flaky flows are diagnosable without re-run. */
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npm run build -w web && npm run preview -w web -- --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    /**
     * Reusing a manually started preview can skip `VITE_E2E=1` here and break
     * `e2e/e2e-probes.spec.ts`. Use `npm run test:e2e:smoke` for marketing smoke;
     * run `npm run test:e2e:probes` with no other server on this port (or CI).
     */
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    /** So `vite build` succeeds in CI / clean clones without a root `.env` (matches Vitest fallbacks). */
    env: {
      ...process.env,
      VITE_SUPABASE_URL:
        process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY:
        process.env.VITE_SUPABASE_ANON_KEY ?? "playwright-e2e-anon-placeholder",
      VITE_SITE_URL: process.env.VITE_SITE_URL ?? baseURL,
      VITE_STRIPE_ARCHITECT_PRICE_ID:
        process.env.VITE_STRIPE_ARCHITECT_PRICE_ID ?? "price_e2e_placeholder",
      VITE_STRIPE_PROJECT_PASS_PRICE_ID:
        process.env.VITE_STRIPE_PROJECT_PASS_PRICE_ID ??
        "price_e2e_placeholder",
      /** Dev-only routes under /__e2e__/ for Playwright (popup + offline save probes). */
      VITE_E2E: "1",
    },
  },
});
