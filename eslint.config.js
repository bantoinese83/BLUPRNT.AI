import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
  {
    ignores: [
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "supabase/functions",
      "mobile/.expo",
      ".expo",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: [
      "web/**/*.ts",
      "web/**/*.tsx",
      "mobile/**/*.ts",
      "mobile/**/*.tsx",
      "shared/**/*.ts",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      /** `import { type X }` for value modules; keep `import('pkg').T` in .d.ts & test mocks. */
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
  {
    files: [
      "web/**/*.test.ts",
      "web/**/*.test.tsx",
      "web/**/tests/**/*.ts",
      "web/**/tests/**/*.tsx",
      "mobile/**/*.test.ts",
      "mobile/**/*.test.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
