import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  /** Same as Vite app — load `.env` from monorepo root for tests. */
  envDir: path.resolve(__dirname, ".."),
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "../shared/lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      /**
       * Critical application layers: data/auth logic, hooks, services, app shell context,
       * and selected shell components (error boundary, auth redirect listener).
       */
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/hooks/**/*.ts",
        "src/services/**/*.ts",
        "src/contexts/**/*.{ts,tsx}",
        "src/components/ErrorBoundary.tsx",
        "src/components/ComponentErrorBoundary.tsx",
      ],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "**/*.{test,spec}.{ts,tsx}",
        /** Large PDF pipeline — exercised via manual QA / E2E; keep threshold realistic. */
        "src/lib/pdf-export.ts",
        /** Canvas / animation — covered by manual QA; jsdom has no real canvas timing. */
        "src/lib/dashboard-celebration-confetti.ts",
        "src/lib/onboarding-icons.tsx",
        "src/lib/onboarding-custom-icon.tsx",
        /** Multi-step wizard — smoke-tested; full flow covered by E2E. */
        "src/contexts/OnboardingProvider.tsx",
        /** Re-exports from @shared tested there. */
        "src/lib/activity.ts",
        "src/lib/plan-vs-actual.ts",
        "src/lib/dashboard-load-error.ts",
        /** Constants only. */
        "src/lib/animations.ts",
      ],
      thresholds: {
        lines: 80,
        /**
         * Branch coverage is harder on guard-heavy UI hooks; lines are the primary gate.
         * With `coverage.all`, aggregate branches sit ~72–73% in this repo’s current layout.
         */
        branches: 72,
        functions: 78,
        statements: 80,
      },
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});
