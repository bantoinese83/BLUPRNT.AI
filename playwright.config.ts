import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build -w web && npm run preview -w web -- --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
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
    },
  },
});
