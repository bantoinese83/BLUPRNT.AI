import "../global.css";
import { LogBox, Platform } from "react-native";

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release",
]);

import { QueryClientProvider } from "@tanstack/react-query";
import { initMobileSentry, isSentryConfigured, Sentry } from "@/lib/sentry";
import { queryClient } from "@/lib/query-client";
import Purchases from "react-native-purchases";
import Constants, { ExecutionEnvironment } from "expo-constants";

initMobileSentry();

import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
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
import { useEffect, useState, useRef } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthProvider";
import { useAuth } from "@/contexts/auth-context";
import { AppToastHost } from "@/components/AppToastHost";
import { BrandedSplash } from "@/components/BrandedSplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import NetInfo from "@react-native-community/netinfo";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "@/constants/Theme";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";
import { isNetworkReachable } from "@/lib/network-status";
import { WifiOff } from "lucide-react-native";
import { getProductAnalyticsConsent } from "@/lib/product-analytics";

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

// SplashScreen hide logic handled inside RootLayout hook

function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const { isOutdated } = useVersionCheck();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide native layer as soon as JS runs so BrandedSplash (real icon + wordmark)
  // shows immediately. Expo Go may still flash its default for a moment before JS.
  useEffect(() => {
    void SplashScreen.hideAsync();
    void getProductAnalyticsConsent();

    // Initialize RevenueCat
    const isExpoGo =
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY || "";

    if (isExpoGo) {
      console.log("Expo Go detected. Using RevenueCat Test Store Key.");
      Purchases.configure({ apiKey: testKey });
    } else {
      if (Platform.OS === "ios") {
        Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || "",
        });
      } else if (Platform.OS === "android") {
        Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || "",
        });
      }
    }
  }, []);

  if (!loaded || isOutdated) {
    return <BrandedSplash />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <RootLayoutNav />
            <AppToastHost />
            <OfflineBannerHost />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

export default isSentryConfigured() ? Sentry.wrap(RootLayout) : RootLayout;

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
      setIsOffline(!isNetworkReachable(state));
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View
      style={[styles.offlineBanner, { top: insets.top + 8 }]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel="No internet connection. Updates are paused until you are back online."
    >
      <WifiOff size={16} color="white" importantForAccessibility="no" />
      <Text style={styles.offlineText} importantForAccessibility="no">
        No connection — updates pause until you’re back online
      </Text>
    </View>
  );
}

function RootLayoutNav() {
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

    const onRecoveryScreen = pathname.includes("reset-password");
    if ((inAuthGroup || isLanding) && !onRecoveryScreen) {
      void (async () => {
        const href = await getPostAuthRedirectHref();
        router.replace(href);
      })();
    }
  }, [session, loading, segments, pathname]);

  // Sync RevenueCat & Sentry Identity
  const lastSyncedId = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const currentId = session?.user?.id || null;

    // Prevent redundant syncs to avoid RevenueCat 429 "request in flight" errors
    if (currentId === lastSyncedId.current) return;
    lastSyncedId.current = currentId;

    if (currentId) {
      // Sentry
      Sentry.setUser({ id: currentId, email: session?.user?.email });

      // RevenueCat
      Purchases.logIn(currentId).catch((e) => {
        // Silently handle 429s as they are often transient during HMR/fast reloads
        if (e.code === 16 || e.message?.includes("429")) return;
        console.error("RevenueCat Login Error:", e);
      });
    } else {
      // Sentry
      Sentry.setUser(null);

      // RevenueCat
      Purchases.logOut().catch((e) => {
        console.error("RevenueCat Logout Error:", e);
      });
    }
  }, [session, loading]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // Universal fail-safe
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/reset-password" />
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
