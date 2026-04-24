import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { Stack, router, useSegments, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import Purchases from "react-native-purchases";
import { WifiOff } from "lucide-react-native";

import { Theme } from "@/constants/Theme";
import { useAuth } from "@/contexts/auth-context";
import { isNetworkReachable } from "@/lib/network-status";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";
import { Sentry } from "@/lib/sentry";

export function OfflineBannerHost() {
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
      pointerEvents="none"
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

export function RootLayoutNav() {
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
    const onProjectRoute =
      segs[0] === "project" || pathname.startsWith("/project/");
    const onSupportRoute =
      segs[0] === "support" ||
      pathname === "/support" ||
      pathname.startsWith("/support/");
    const isSignedOutRoute = pathname === "/signed-out";
    const inProtectedShell =
      !isSignedOutRoute &&
      (inTabsGroup || onProjectRoute || onSupportRoute || onOnboarding);

    const isLanding =
      pathname === "/" ||
      pathname === "/index" ||
      pathname === "" ||
      segs.length === 0 ||
      (segs.length === 1 && segs[0] === "index");

    if (!session && inProtectedShell) {
      router.replace("/signed-out");
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

    if (currentId === lastSyncedId.current) return;
    lastSyncedId.current = currentId;

    if (currentId) {
      Sentry.setUser({ id: currentId, email: session?.user?.email });
      Purchases.logIn(currentId).catch((e) => {
        if (e.code === 16 || e.message?.includes("429")) return;
        if (__DEV__) console.warn("[revenuecat] login error:", e);
      });
    } else {
      Sentry.setUser(null);
      Purchases.logOut().catch((e) => {
        if (__DEV__) console.warn("[revenuecat] logout error:", e);
      });
    }
  }, [session, loading]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
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
        <Stack.Screen name="signed-out" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
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
    zIndex: 10,
  },
  offlineText: {
    color: "white",
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
  },
});
