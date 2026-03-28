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

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  withScroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: Array<"top" | "right" | "bottom" | "left">;
  withLogo?: boolean;
}

export function ScreenWrapper({
  children,
  style,
  withScroll = false,
  onRefresh,
  refreshing = false,
  edges = ["top", "left", "right", "bottom"],
  withLogo = false,
}: Props) {
  return (
    <GradientBackground>
      <StatusBar style="light" />
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
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="white"
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  brandingText: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    paddingBottom: 24, // Universal breathing room at the bottom
  },
  scrollContent: {
    flexGrow: 1,
  },
});
