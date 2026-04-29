import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  /** Monorepo root — same as `envDir` (shared `.env` for web + tooling). */
  const rootDir = path.resolve(__dirname, "..");
  const env = loadEnv(mode, rootDir, "");
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN?.trim();

  const webPkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf8"),
  ) as { version?: string };
  const appVersion = webPkg.version?.trim() || "0.0.0";

  /** Only wire Sentry when a token is present (CI / release). Avoids noisy local build warnings. */
  const sentryPlugins =
    sentryAuthToken !== undefined && sentryAuthToken.length > 0
      ? [
          sentryVitePlugin({
            org: "base83",
            project: "bluprntai-web",
            authToken: sentryAuthToken,
            telemetry: false,
          }),
        ]
      : [];

  return {
    /** Load `.env` from monorepo root (one file for web + tooling). */
    envDir: rootDir,
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    },
    plugins: [react(), tailwindcss(), ...sentryPlugins],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "../shared"),
      },
      /** One React instance (workspace hoisting can otherwise duplicate in odd setups). */
      dedupe: ["react", "react-dom"],
    },
    /** Pre-bundle heavy deps on first `vite` start — faster dev server cold boot. */
    optimizeDeps: {
      include: ["@tanstack/react-query", "@supabase/supabase-js"],
    },
    server: {
      port: 3000,
      /** Keep prior terminal output visible (errors, URLs) instead of clearing the screen. */
      clearScreen: false,
      /** Fail fast with a clear error instead of silently using another port (common DX footgun). */
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      /** Monorepo: do not watch unrelated apps — faster cold start & fewer spurious HMRs. (Keep `../shared` watched: web imports it.) */
      watch: {
        ignored: [
          path.resolve(__dirname, "../mobile/**"),
          path.resolve(__dirname, "../e2e/**"),
          path.resolve(__dirname, "../supabase/**"),
          "**/coverage/**",
          "**/playwright-report/**",
          "**/test-results/**",
        ],
      },
    },
    build: {
      sourcemap: true,
      target: "es2022",
      // jsPDF is loaded only via dynamic import() in pdf-export; the chunk is large by nature.
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-motion": ["motion", "motion/react"],
            "vendor-lucide": ["lucide-react"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-rough": ["rough-notation"],
            "vendor-sentry": [
              "@sentry/react",
              "@sentry/core",
              "@sentry/browser",
            ],
            "vendor-ui": ["sonner"],
          },
        },
      },
    },
  };
});
