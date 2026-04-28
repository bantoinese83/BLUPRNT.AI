# BLUPRNT.AI Technical Audit Report

_Audit Date: Tuesday, April 28, 2026_

## Executive Summary

The BLUPRNT.AI monorepo demonstrates strong foundational quality with high unit test coverage and successful production builds for both web and mobile. However, the audit identified critical linting errors, a broken Edge Function type-check, and several flaky or failing E2E tests that require attention to ensure deployment stability.

## Code Quality

- **Linting:** 2 errors and 20 warnings.
  - **Errors:** `@typescript-eslint/no-unsafe-function-type` in `shared/realtime-logic.test.ts` and `web/.../useWebDashboardProjectRealtime.test.tsx`.
  - **Warnings:** 20 instances of `no-explicit-any`, primarily in the mobile source.
- **Typechecking:** Generally passing, but interrupted by lint failures in the combined check script.

## Maintenance (Knip)

- **Unused Files:** `mobile/src/types/database.ts` is reported as unused.
- **Configuration:** `expo-router/entry` entry file not found in mobile `package.json` (Configuration hint).

## Testing

- **Unit Tests:**
  - **Shared:** 202 passed (95.8% Stmts).
  - **Web:** 575 passed (90.1% Stmts).
  - **Mobile:** 108 passed (98.9% Stmts).
- **E2E Tests (Playwright):**
  - **Status:** 30 passed, 10 failed, 4 skipped.
  - **Failures:** Timeouts and visibility issues in `e2e-probes`, `offline-banner`, `pdf_fidelity`, `signup-dashboard`, and `sync_integrity`. This suggests environmental latency or flakiness in the E2E environment.

## Build Integrity

- **Web:** Vite production build successful.
- **Mobile:** Expo export for iOS and Android successful.

## Edge Functions

- **Status:** FAILED.
- **Issue:** `deno check` failed for `get-invoice/index.ts` with error `Cannot find module`. Other functions (chat, checkout, delete-account) passed check.

## Performance

- **Status:** Preliminary observation.
- **Observation:** Web build size is well-optimized with code-splitting (main chunk ~544kB). Lighthouse script requires adjustment to match current project structure.

## Recommendations

1. **Fix Linting Errors:** Address `Function` type usage in tests to satisfy the `--max-warnings 0` requirement.
2. **Repair Edge Function:** Investigate the import path or missing file in `supabase/functions/get-invoice/`.
3. **Stabilize E2E:** Review Playwright timeouts; consider increasing `toBeVisible` thresholds for resource-heavy tests like PDF export and sync.
4. **Cleanup:** Safely remove `mobile/src/types/database.ts` if confirmed redundant.
5. **Script Fix:** Update `scripts/lighthouse-local.sh` to use existing root scripts (e.g., `npm run build -w web`) instead of missing `build:web`.

---

_Audit conducted by Gemini CLI._
