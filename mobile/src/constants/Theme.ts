import { BLUPRNT_COLORS } from "@shared/constants/design-tokens";

/**
 * BLUPRNT design tokens — colors come from `@shared/constants/design-tokens`
 * (web mirrors the same hex values in `web/src/index.css` `@theme`).
 *
 * Layout principles (spacing / type / color):
 * — Avoid pure #000 for text; use ink + slate scale for comfortable contrast.
 * — Spacing: 8px grid (multiples of 8 only in `spacing`).
 * — Color: ~60% neutrals, ~30% surfaces, ~10% accent.
 * — Type: one family (Outfit), distinct steps (~1.25×+) between body → subhead → display.
 */
export const Theme = {
  colors: {
    /** ~60% — page field */
    background: BLUPRNT_COLORS.surface,
    /** ~30% — elevated surfaces */
    header: BLUPRNT_COLORS.card,
    card: BLUPRNT_COLORS.card,

    brand: {
      light: BLUPRNT_COLORS.accentLight,
      primary: BLUPRNT_COLORS.accent,
      deep: BLUPRNT_COLORS.teal800,
    },

    cta: {
      from: BLUPRNT_COLORS.teal950,
      to: BLUPRNT_COLORS.primary,
    },

    text: {
      primary: BLUPRNT_COLORS.ink,
      secondary: BLUPRNT_COLORS.slate500,
      onSoft: BLUPRNT_COLORS.slate700,
      muted: BLUPRNT_COLORS.slate400,
      disabled: BLUPRNT_COLORS.slate300,
    },

    status: {
      success: BLUPRNT_COLORS.success,
      error: BLUPRNT_COLORS.error,
      warning: BLUPRNT_COLORS.warning,
      info: BLUPRNT_COLORS.info,
    },

    border: BLUPRNT_COLORS.borderDefault,
    divider: BLUPRNT_COLORS.borderLight,
    inputBg: BLUPRNT_COLORS.slate50,
    inputBorder: BLUPRNT_COLORS.borderDefault,

    glass: {
      bg: "rgba(255, 255, 255, 0.7)",
      border: "rgba(255, 255, 255, 0.15)",
      highlight: "rgba(255, 255, 255, 0.25)",
      intensity: 80,
      tint: "light" as const,
    },
  },

  /** All values are multiples of 8 (8px grid). `sm` & `md` are both 16 — use `sm` for tight clusters, `md` for default insets. */
  spacing: {
    xs: 8,
    sm: 16,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    /** Standard horizontal screen gutter */
    margin: 24,
    /** Default button / block horizontal padding */
    padding: 24,
  },

  layout: {
    /** ≈65ch at ~16px body — long-form copy on phones (full width) vs tablets */
    readingMaxWidth: 560,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    family: {
      regular: "Outfit_400Regular",
      medium: "Outfit_500Medium",
      semibold: "Outfit_600SemiBold",
      bold: "Outfit_700Bold",
      black: "Outfit_800ExtraBold",
    },
    size: {
      xs: 11,
      sm: 12,
      md: 14,
      lg: 16,
      /** Subhead / emphasized UI — ~1.25× body */
      xl: 20,
      /** Section titles — ~1.2× xl */
      xxl: 24,
      /** Major headings — ~1.33× xxl */
      display: 32,
      /** Hero / marketing headline — ~1.25× display */
      hero: 40,
    },
  },

  shadows: {
    soft: {
      shadowColor: BLUPRNT_COLORS.teal950,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    brand: {
      shadowColor: BLUPRNT_COLORS.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    /** Neutral card drop — matches web `--shadow-drop-md` */
    card: {
      shadowColor: BLUPRNT_COLORS.teal950,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
      elevation: 5,
    },
    cardElevated: {
      shadowColor: BLUPRNT_COLORS.teal950,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
      elevation: 8,
    },
    /** Physical depth shadow for 2026 aesthetic */
    spatial: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 30,
      elevation: 15,
    },
  },
};

export default Theme;
