/* eslint-disable react-refresh/only-export-components */
import "../global.css";
import { LogBox, Platform } from "react-native";

LogBox.ignoreLogs([
  "Constants.manifest has been deprecated",
  "Sending `onAnimatedValueUpdate` with no listeners",
  "Multiple instances of Three.js being imported",
]);

import { QueryClientProvider } from "@tanstack/react-query";
import { initMobileSentry, isSentryConfigured, Sentry } from "@/lib/sentry";
import { queryClient } from "@/lib/query-client";
import Purchases from "react-native-purchases";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";

initMobileSentry();

import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { BrandedSplash } from "@/components/BrandedSplash";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { AuthProvider } from "@/contexts/AuthProvider";
import { PremiumProvider } from "@/contexts/PremiumProvider";
import { ConfirmationProvider } from "@/contexts/ConfirmationContext";
import { AppToastHost } from "@/components/AppToastHost";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import {
  getProductAnalyticsConsent,
  setProductAnalyticsHandler,
} from "@/lib/product-analytics";

import {
  OfflineBannerHost,
  RootLayoutNav,
} from "@/components/layout/RootLayoutHelpers";
import { DashboardForegroundRefresh } from "@/components/layout/DashboardForegroundRefresh";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// SplashScreen hide logic handled inside RootLayout hook

import { LockScreen } from "@/components/LockScreen";

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

  // Hide native layer as soon as JS runs so BrandedSplash (real logo)
  // shows immediately. Native splash is often low-res or misaligned.
  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    void getProductAnalyticsConsent();

    // Wire a production analytics SDK here when available.
    if (__DEV__) {
      setProductAnalyticsHandler((name, props) => {
        console.log(`[analytics:dev] ${name}`, props ?? {});
      });
    }

    // Initialize RevenueCat
    const isExpoGo =
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY || "";
    const isSimulator = !Device.isDevice && Platform.OS !== "web";
    const forceProdInSim =
      process.env.EXPO_PUBLIC_REVENUECAT_FORCE_PROD_IN_SIM === "true";

    // Simulators default to "Test Store" (Preview Mode) to bypass unreliable Apple Sandbox
    // But if we want to use local StoreKit testing, we need to use the production key.
    if (isExpoGo || (isSimulator && !forceProdInSim)) {
      if (__DEV__) {
        console.log(
          `[revenuecat] ${isSimulator ? "Simulator" : "Expo Go"} detected. Using Preview Mode.`,
        );
      }
      Purchases.configure({ apiKey: testKey });
    } else {
      const apiKey =
        Platform.OS === "ios"
          ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
          : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

      if (apiKey) {
        if (__DEV__) {
          console.log(
            `[revenuecat] Physical device or forced simulator (${Platform.OS}) — using production key.`,
          );
        }
        Purchases.configure({ apiKey });
      } else if (testKey) {
        if (__DEV__) {
          console.warn(
            "[revenuecat] No production API key — falling back to Test Store.",
          );
        }
        Purchases.configure({ apiKey: testKey });
      } else if (__DEV__) {
        console.error("[revenuecat] No API keys found for configuration.");
      }
    }
  }, []);

  if (!loaded && !error) {
    return (
      <SafeAreaProvider>
        <BrandedSplash />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <DashboardForegroundRefresh />
            <AuthProvider>
              <PremiumProvider>
                <ConfirmationProvider>
                  <RootLayoutNav />
                  <AppToastHost />
                  <OfflineBannerHost />
                  {isOutdated && <LockScreen type="update-required" />}
                </ConfirmationProvider>
              </PremiumProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default isSentryConfigured() ? Sentry.wrap(RootLayout) : RootLayout;
