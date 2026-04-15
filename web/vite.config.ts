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
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
    build: {
      sourcemap: true,
      // jsPDF is loaded only via dynamic import() in pdf-export; the chunk is large by nature.
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-motion": ["motion", "motion/react"],
            "vendor-lucide": ["lucide-react"],
            "vendor-pdf": ["jspdf", "html2canvas"],
            "vendor-supabase": ["@supabase/supabase-js"],
          },
        },
      },
    },
  };
});
