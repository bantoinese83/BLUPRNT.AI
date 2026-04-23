import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Theme } from "@/constants/Theme";
import iconMark from "@assets/images/icon.png";

const SYSTEM = {
  heavy: Platform.select({
    ios: { fontFamily: "System", fontWeight: "800" as const },
    default: { fontFamily: "sans-serif", fontWeight: "800" as const },
  }),
  medium: Platform.select({
    ios: { fontFamily: "System", fontWeight: "500" as const },
    default: { fontFamily: "sans-serif", fontWeight: "500" as const },
  }),
} as const;

type Variant = "standalone" | "embedded";

type Props = {
  variant?: Variant;
  /** Short line under the spinner — keep non-technical. */
  status?: string;
  style?: ViewStyle;
};

/**
 * First-run / auth boot chrome. Uses system-weight text so it looks correct
 * before custom fonts load (`standalone`). Matches the rest of the app’s
 * light gradient shell (`embedded` inside `ScreenWrapper`).
 */
export function LaunchLoadingLayout({
  variant = "standalone",
  status = "Getting things ready…",
  style,
}: Props) {
  const insets = useSafeAreaInsets();

  const body = (
    <View
      style={[
        styles.center,
        variant === "standalone" && {
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
    >
      <MotiView
        from={{ opacity: 0, scale: 0.92, translateY: 10 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 520 }}
        style={styles.hero}
      >
        <View style={styles.logoCard}>
          <Image
            source={iconMark}
            style={styles.logoImage}
            contentFit="cover"
            accessibilityLabel="BLUPRNT"
          />
        </View>
        <Text style={[styles.wordmark, SYSTEM.heavy]}>BLUPRNT</Text>
        <Text style={[styles.aiLine, SYSTEM.medium]}>
          AI for your home numbers
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 200 }}
        style={styles.footer}
      >
        <ActivityIndicator
          color={Theme.colors.brand.primary}
          style={styles.spinner}
        />
        <Text style={[styles.status, SYSTEM.medium]}>{status}</Text>
      </MotiView>
    </View>
  );

  if (variant === "embedded") {
    return <View style={styles.embedRoot}>{body}</View>;
  }

  return (
    <View style={styles.standRoot}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0F172A", "#1E293B"]}
        style={StyleSheet.absoluteFill}
      />
      {body}
    </View>
  );
}

const LOGO = 88;

const styles = StyleSheet.create({
  standRoot: {
    flex: 1,
  },
  embedRoot: {
    flex: 1,
    minHeight: 320,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.margin,
  },
  hero: {
    alignItems: "center",
  },
  logoCard: {
    width: LOGO + 40,
    height: LOGO + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: LOGO + 20,
    height: LOGO + 20,
    borderRadius: 24,
  },
  wordmark: {
    marginTop: 22,
    fontSize: 26,
    letterSpacing: 5,
    color: "#FFFFFF",
  },
  aiLine: {
    marginTop: 6,
    fontSize: 14,
    color: "#94A3B8",
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: 36,
    alignItems: "center",
    gap: 12,
  },
  spinner: {
    transform: [{ scale: 1.05 }],
  },
  status: {
    fontSize: 14,
    color: Theme.colors.text.muted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
