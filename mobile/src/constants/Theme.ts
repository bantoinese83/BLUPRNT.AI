/**
 * BLUPRNT design tokens — keep in sync with web `src/index.css` `@theme` block
 * (surface, accent teal, slate text, primary CTA slate-900).
 *
 * Layout principles (spacing / type / color):
 * — Avoid pure #000 for text; use slate/gray-900-scale inks for comfortable contrast.
 * — Spacing: 8px grid (multiples of 8 only in `spacing`).
 * — Color: ~60% dominant neutrals (background), ~30% surfaces (cards/header), ~10% accent (brand CTAs).
 * — Type: one family (Outfit), distinct steps (~1.25×+) between body → subhead → display.
 */
export const Theme = {
  colors: {
    /** ~60% — page field */
    background: "#f9fafb",
    /** ~30% — elevated surfaces */
    header: "#ffffff",
    card: "#ffffff",

    // Accent (~10%) — matches web `--color-accent` / EmptyState highlights
    brand: {
      light: "#14b8a6", // Teal 500
      primary: "#0d9488", // Teal 600
      deep: "#115e59", // Teal 800
    },

    // Primary CTA gradient — matches web `.liquid-metal-button` (slate-900 base)
    cta: {
      from: "#0f172a",
      to: "#1e293b",
    },

    // Text — ink tones (never pure black #000 for primary body copy)
    text: {
      primary: "#111827", // Gray 900 — readable without harsh #000
      secondary: "#64748b", // Slate 500
      /** Strong body on soft backgrounds (e.g. Slate 50) — better than secondary at small sizes */
      onSoft: "#334155", // Slate 700
      muted: "#94a3b8", // Slate 400
      disabled: "#cbd5e1", // Slate 300
    },

    // Status Palette
    status: {
      success: "#10b981", // Emerald 500
      error: "#f43f5e", // Rose 500
      warning: "#f59e0b", // Amber 500
      info: "#3b82f6", // Blue 500
    },

    // UI Elements
    border: "#e2e8f0", // Slate 200
    divider: "#f1f5f9", // Slate 100
    inputBg: "#f8fafc", // Slate 50
    inputBorder: "#e2e8f0", // Slate 200

    // Glassmorphism (Light Optimized)
    glass: {
      bg: "rgba(255, 255, 255, 0.8)",
      border: "rgba(15, 23, 42, 0.08)",
      highlight: "rgba(255, 255, 255, 0.5)",
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
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    brand: {
      shadowColor: "#0d9488",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    /** Neutral card drop — matches web `--shadow-drop-md` */
    card: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
      elevation: 5,
    },
    cardElevated: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
      elevation: 8,
    },
  },
};

export default Theme;
