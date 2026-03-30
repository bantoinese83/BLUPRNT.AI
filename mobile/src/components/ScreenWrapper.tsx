import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  RefreshControl,
  Text,
} from "react-native";
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
}: Props) {
  return (
    <GradientBackground>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={edges}>
        {withLogo && (
          <View style={styles.logoHeader}>
            <Logo size={32} />
            <Text style={styles.brandingText}>BLUPRNT.AI</Text>
          </View>
        )}

        {withScroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
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
        )}
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
});
