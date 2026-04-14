import { BLUPRNT_COLORS } from "./design-tokens";

/**
 * SVG gradients, confetti, and rough-notation accents.
 * Not mirrored in `index.css` @theme (parity script skips these).
 */
export const VIZ_GRADIENT = {
  healthAnalyzing: {
    stop1: BLUPRNT_COLORS.slate400,
    stop2: BLUPRNT_COLORS.slate500,
  },
  healthOver: {
    stop1: BLUPRNT_COLORS.error,
    stop2: "#ea580c",
  },
  healthAtLimit: {
    stop1: "#fbbf24",
    stop2: BLUPRNT_COLORS.warning,
  },
  healthExcellent: {
    stop1: "#34d399",
    stop2: BLUPRNT_COLORS.accentLight,
  },
  healthHealthy: {
    stop1: BLUPRNT_COLORS.accentLight,
    stop2: BLUPRNT_COLORS.info,
  },
} as const;

export const CONFETTI_PALETTES = {
  brandMuted: [
    BLUPRNT_COLORS.accentLight,
    BLUPRNT_COLORS.slate950,
    BLUPRNT_COLORS.slate400,
  ] as const,
  firstDocument: [
    BLUPRNT_COLORS.success,
    BLUPRNT_COLORS.card,
    BLUPRNT_COLORS.slate950,
  ] as const,
} as const;

export const ROUGH_NOTATION = {
  /** Default rough-notation highlight (soft rose) */
  highlightRose: "#ffd1dc",
} as const;

export const ESTIMATE_CHART_COLORS = [
  BLUPRNT_COLORS.accentLight,
  "#2dd4bf",
  BLUPRNT_COLORS.accent,
] as const;

/** iPhone-style device mockup (SVG fills; not in CSS @theme). */
export const DEVICE_CHROME = {
  frame: "#e5e5e5",
  island: "#f5f5f5",
} as const;
