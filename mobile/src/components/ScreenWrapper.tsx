import React from "react";
import {
  StyleSheet,
  View,
  type ViewStyle,
  ScrollView,
  RefreshControl,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { StatusBar } from "expo-status-bar";
import { Logo } from "@/components/ui/Logo";
import { Theme } from "@/constants/Theme";
import { TAB_BAR_SCROLL_PADDING } from "@/constants/Layout";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  withScroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: Array<"top" | "right" | "bottom" | "left">;
  withLogo?: boolean;
  withTabBar?: boolean;
  withKeyboard?: boolean;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: ViewStyle;
  /** When `withScroll` is true, attaches to the inner `ScrollView` (e.g. programmatic scroll). */
  scrollViewRef?: React.RefObject<ScrollView | null>;
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
  keyboardVerticalOffset = 0,
  contentContainerStyle,
  scrollViewRef,
}: Props) {
  const content = withScroll ? (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      contentContainerStyle={[
        styles.scrollContent,
        withTabBar && { paddingBottom: TAB_BAR_SCROLL_PADDING },
        contentContainerStyle,
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
      keyboardVerticalOffset={keyboardVerticalOffset}
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
        {withLogo && (
          <View style={styles.logoHeader}>
            <Logo size={54} />
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
});
