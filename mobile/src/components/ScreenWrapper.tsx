import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  RefreshControl,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackground } from "./ui/GradientBackground";
import { StatusBar } from "expo-status-bar";
import { Logo } from "./ui/Logo";
import { Theme } from "../constants/Theme";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "../../app/(tabs)/_layout";

// Total vertical space consumed by the floating tab bar above the safe-area bottom
const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 8;

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  withScroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: Array<"top" | "right" | "bottom" | "left">;
  withLogo?: boolean;
  /** Pass true (default) when the screen sits inside the main tab navigator
   *  so scroll content gets bottom padding equal to the floating tab bar height. */
  withTabBar?: boolean;
  /** Enables KeyboardAvoidingView for the entire screen */
  withKeyboard?: boolean;
}

export function ScreenWrapper({
  children,
  style,
  withScroll = false,
  onRefresh,
  refreshing = false,
  edges = ["top", "left", "right", "bottom"],
  withLogo = false,
  withTabBar = true,
  withKeyboard = false,
}: Props) {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);

      if (offline) {
        setShowBanner(true);
      } else {
        // Delay hiding the banner to prevent flickering on rapid transitions
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, []);

  const content = withScroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scrollContent,
        withTabBar && { paddingBottom: TAB_BAR_CLEARANCE },
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.brand.primary}
            colors={[Theme.colors.brand.primary]}
          />
        ) : undefined
      }
    >
      <View style={[styles.content, style]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  );

  const wrappedContent = withKeyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <GradientBackground>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={edges}>
        <AnimatePresence>
          {showBanner && (
            <MotiView
              from={{ translateY: -50, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: -50, opacity: 0 }}
              style={styles.offlineBanner}
            >
              <WifiOff size={16} color="white" />
              <Text style={styles.offlineText}>No internet connection</Text>
            </MotiView>
          )}
        </AnimatePresence>

        {withLogo && (
          <View style={styles.logoHeader}>
            <Logo size={32} />
            <Text style={styles.brandingText}>BLUPRNT.AI</Text>
          </View>
        )}
        {wrappedContent}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  brandingText: {
    fontSize: Theme.typography.size.xl,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  offlineBanner: {
    backgroundColor: Theme.colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
  },
  offlineText: {
    color: "white",
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
  },
});
