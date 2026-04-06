import { Theme } from "../src/constants/Theme";

/** Legacy Expo template hook — values track `Theme` + web palette for consistency */
export default {
  light: {
    text: Theme.colors.text.primary,
    background: Theme.colors.background,
    tint: Theme.colors.brand.primary,
    tabIconDefault: Theme.colors.text.muted,
    tabIconSelected: Theme.colors.brand.primary,
  },
  dark: {
    text: "#f8fafc",
    background: Theme.colors.text.primary,
    tint: Theme.colors.brand.light,
    tabIconDefault: "#64748b",
    tabIconSelected: Theme.colors.brand.light,
  },
};
