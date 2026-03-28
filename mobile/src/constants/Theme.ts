export const Theme = {
  colors: {
    // Deep Space Palette
    background: "#020617", // Slate 950
    header: "#0f172a", // Slate 900
    card: "rgba(255, 255, 255, 0.03)",

    // Brand Palette
    brand: {
      light: "#818cf8", // Indigo 400
      primary: "#4f46e5", // Indigo 600
      deep: "#3730a3", // Indigo 800
    },

    // Text Palette
    text: {
      primary: "#ffffff",
      secondary: "#94a3b8", // Slate 400
      muted: "#64748b", // Slate 500
      disabled: "#475569", // Slate 600
    },

    // Status Palette
    status: {
      success: "#10b981", // Emerald 500
      error: "#f43f5e", // Rose 500
      warning: "#f59e0b", // Amber 500
      info: "#3b82f6", // Blue 500
    },

    // Glassmorphism
    glass: {
      bg: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.08)",
      highlight: "rgba(255, 255, 255, 0.15)",
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
