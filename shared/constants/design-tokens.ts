/**
 * Canonical BLUPRNT design tokens (hex / rgba).
 *
 * - **Web:** Keep `web/src/index.css` `@theme` in sync when changing these values.
 *   CI enforces overlap via `node scripts/check-design-token-parity.mjs` (see root `npm run lint`).
 * - **Mobile:** `mobile/src/constants/Theme.ts` builds from this module; NativeWind
 *   slate utilities stay aligned via `mobile/tailwind.config.js` + `mobile/global.css`
 *   (same `slate400` / `slate500` / `slate700` hex as web `@theme`).
 *
 * Ink (`ink`) is body text — matches web `--color-slate-900` (gray-900, not default Tailwind slate-900).
 */
export const BLUPRNT_COLORS = {
  primary: "#134e4a",
  primaryHover: "#115e59",
  primaryMuted: "#f8fafc",
  surface: "#f9fafb",
  card: "#ffffff",
  accent: "#0d9488",
  accentLight: "#14b8a6",
  accentSoft: "rgba(45, 212, 191, 0.32)",
  /** Matches `web/src/index.css` `--color-teal-600` (parity: check-design-token-parity.mjs). */
  teal600: "#086960",
  teal800: "#115e59",
  teal950: "#042f2e",
  ink: "#111827",
  borderLight: "#f1f5f9",
  borderDefault: "#e2e8f0",
  borderFocus: "#334155",
  slate950: "#020617",
  /** Matches web `--color-slate-500` (slightly darker than default Tailwind slate-500 for contrast). */
  slate500: "#475569",
  /** Matches web `--color-slate-400`. */
  slate400: "#64748b",
  slate700: "#334155",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  highlightWash: "rgba(13, 148, 136, 0.22)",
  highlightUnderline: "#14b8a6",
  glassBorder: "rgba(15, 23, 42, 0.08)",
  success: "#10b981",
  error: "#f43f5e",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;
