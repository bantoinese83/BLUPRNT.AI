import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  define: {
    __DEV__: "true",
  },
  test: {
    setupFiles: ["./src/test/vitest-setup.ts"],
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: [
        "src/lib/app-toast.ts",
        "src/lib/auth-linking.ts",
        "src/lib/image-utils.ts",
        "src/lib/onboarding-draft.ts",
        "src/lib/open-original-document.ts",
        "src/lib/query-client.ts",
        "src/lib/seller-packet-appendix.ts",
        "src/lib/share-project.ts",
        "src/lib/upload-document.ts",
        "src/lib/zip-from-location.ts",
      ],
      exclude: [
        /** Re-exports from @shared tested there. */
        "src/lib/activity.ts",
        "src/lib/dashboard-load-error.ts",
        "src/lib/plan-vs-actual.ts",
        "node_modules/",
        "**/*.d.ts",
        "**/*.{test,spec}.ts",
        "src/lib/pdf-export.ts",
        "src/lib/supabase.ts",
        "src/lib/sentry.ts",
      ],
      thresholds: {
        lines: 80,
        branches: 65,
        functions: 80,
        statements: 80,
      },
    },
    server: {
      deps: {
        inline: [
          "lucide-react-native",
          "expo-haptics",
          "@testing-library/react-native",
        ],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@app": path.resolve(__dirname, "app"),
      "@assets": path.resolve(__dirname, "assets"),
      /** Real `react-native` entry uses Flow; Vite cannot parse it. */
      "react-native": path.resolve(__dirname, "src/test/react-native-mock.ts"),
    },
  },
});
