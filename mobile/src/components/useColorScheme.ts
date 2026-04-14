import type { ColorSchemeName } from "react-native";

/** App is light-mode only; navigation and UI always use light chrome. */
export const useColorScheme = (): NonNullable<ColorSchemeName> => "light";
