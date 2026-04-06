/**
 * BLUPRNT design tokens — keep in sync with web `src/index.css` `@theme` block
 * (surface, accent indigo, slate text, primary CTA slate-900).
 */
export const Theme = {
  colors: {
    // Light shell — matches web `--color-surface`
    background: "#f9fafb",
    header: "#ffffff",
    card: "#ffffff",

    // Accent (indigo) — matches web `--color-accent` / EmptyState highlights
    brand: {
      light: "#6366f1", // Indigo 500
      primary: "#4f46e5", // Indigo 600
      deep: "#3730a3", // Indigo 800
    },

    // Primary CTA gradient — matches web `.liquid-metal-button` (slate-900 base)
    cta: {
      from: "#0f172a",
      to: "#1e293b",
    },

    // Text Palette
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#64748b", // Slate 500
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

  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    margin: 24,
    padding: 24,
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
      xl: 18,
      xxl: 22,
      display: 28,
      hero: 36,
    },
  },

  shadows: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    brand: {
      shadowColor: "#4f46e5",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

export default Theme;
