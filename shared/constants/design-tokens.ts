/**
 * Canonical BLUPRNT design tokens (hex / rgba).
 *
 * - **Web:** Keep `web/src/index.css` `@theme` in sync when changing these values.
 * - **Mobile:** `mobile/src/constants/Theme.ts` builds from this module.
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
  teal600: "#0d9488",
  teal800: "#115e59",
  teal950: "#042f2e",
  ink: "#111827",
  borderLight: "#f1f5f9",
  borderDefault: "#e2e8f0",
  borderFocus: "#334155",
  slate950: "#020617",
  slate500: "#64748b",
  slate400: "#94a3b8",
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
