import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import { Stack, router, useSegments, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "../src/components/useColorScheme";
import { AuthProvider } from "../src/contexts/AuthProvider";
import { useAuth } from "../src/contexts/auth-context";
import { AppToastHost } from "../src/components/AppToastHost";
import { BrandedSplash } from "../src/components/BrandedSplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../src/constants/Theme";
import { WifiOff } from "lucide-react-native";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Drop the native splash as soon as JS is running so the branded view below
  // is visible (Expo Go often keeps its own artwork until the bundle loads).
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (!loaded) {
    return <BrandedSplash />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootLayoutNav />
          <AppToastHost />
          <OfflineBannerHost />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: Theme.colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    gap: 8,
    zIndex: 9999,
  },
  offlineText: {
    color: "white",
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
  },
});

function OfflineBannerHost() {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.offlineBanner, { top: insets.top + 8 }]}>
      <WifiOff size={16} color="white" />
      <Text style={styles.offlineText}>No internet connection</Text>
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const segs = segments as unknown as string[];
    const inAuthGroup = segs[0] === "(auth)";
    const inTabsGroup = segs[0] === "(tabs)";
    const onOnboarding =
      segs[0] === "onboarding" || pathname.startsWith("/onboarding");
    /** Root carousel — typed `segments` omits `index`, so use pathname + string segments. */
    const isLanding =
      pathname === "/" ||
      pathname === "/index" ||
      pathname === "" ||
      segs.length === 0 ||
      (segs.length === 1 && segs[0] === "index");

    if (!session && inTabsGroup) {
      router.replace("/");
      return;
    }

    if (!session) return;

    if (onOnboarding) {
      return;
    }

    if (inAuthGroup || isLanding) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, pathname]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // Universal fail-safe
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="project/[id]" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}
