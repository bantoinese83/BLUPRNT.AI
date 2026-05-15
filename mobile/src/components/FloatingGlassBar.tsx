import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";

import assetManagementSvg from "@assets/asset-management.svg";
import assistantSvg from "@assets/assistant.svg";
import mansionSvg from "@assets/mansion.svg";
import userSvg from "@assets/user.svg";
import { Plus } from "lucide-react-native";

type RouteName = "index" | "finance" | "new" | "ai" | "profile";
type TabIconRoute = Exclude<RouteName, "new">;

const TAB_ASSETS: Record<TabIconRoute, unknown> = {
  index: mansionSvg,
  finance: assetManagementSvg,
  ai: assistantSvg,
  profile: userSvg,
};

/**
 * 2026 'Liquid Glass' Floating Toolbar.
 * Features:
 * - Glassmorphic backdrop (BlurView)
 * - Specular highlight border
 * - Floating pill shape
 * - Moti-powered spatial animations
 */
export function FloatingGlassBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const routes = state.routes.filter((r) => r.name !== "projects");
  const leftRoutes = routes.filter(
    (r) => r.name === "index" || r.name === "finance",
  );
  const rightRoutes = routes.filter(
    (r) => r.name === "ai" || r.name === "profile",
  );
  const newRoute = routes.find((r) => r.name === "new");

  const pressTab = (
    routeKey: string,
    routeName: string,
    isFocused: boolean,
  ) => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented && !isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(routeName as never);
    }
  };

  const pressFab = () => {
    if (!newRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("new");
  };

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <MotiView
        from={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        style={styles.pillContainer}
      >
        <BlurView
          intensity={Theme.colors.glass.intensity}
          tint={Theme.colors.glass.tint}
          style={StyleSheet.absoluteFill}
        />

        {/* Specular Top Highlight */}
        <View style={styles.specularTop} />

        <View style={styles.content}>
          <View style={styles.side}>
            {leftRoutes.map((route) => {
              const focused = state.routes[state.index]!.key === route.key;
              const asset = TAB_ASSETS[route.name as TabIconRoute];
              return (
                <TabButton
                  key={route.key}
                  focused={focused}
                  asset={asset}
                  label={
                    (descriptors[route.key]!.options.title as string) ||
                    route.name
                  }
                  onPress={() => pressTab(route.key, route.name, focused)}
                />
              );
            })}
          </View>

          <TouchableOpacity
            onPress={pressFab}
            style={styles.fab}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add new"
          >
            <View style={styles.fabInner}>
              <Plus size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <View style={styles.side}>
            {rightRoutes.map((route) => {
              const focused = state.routes[state.index]!.key === route.key;
              const asset = TAB_ASSETS[route.name as TabIconRoute];
              return (
                <TabButton
                  key={route.key}
                  focused={focused}
                  asset={asset}
                  label={
                    (descriptors[route.key]!.options.title as string) ||
                    route.name
                  }
                  onPress={() => pressTab(route.key, route.name, focused)}
                />
              );
            })}
          </View>
        </View>
      </MotiView>
    </View>
  );
}

interface TabButtonProps {
  focused: boolean;
  asset: unknown;
  label: string;
  onPress: () => void;
}

function TabButton({ focused, asset, label, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabBtn}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <MotiView
        animate={{
          scale: focused ? 1.1 : 1,
          translateY: focused ? -2 : 0,
        }}
        transition={{ type: "spring", damping: 12 }}
      >
        <Image
          source={asset as number}
          style={[styles.tabIcon, { opacity: focused ? 1 : 0.4 }]}
          contentFit="contain"
        />
      </MotiView>
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused
              ? Theme.colors.brand.primary
              : Theme.colors.text.muted,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: "transparent",
  },
  pillContainer: {
    width: "100%",
    maxWidth: 420,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.spatial,
  },
  specularTop: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: Theme.colors.glass.highlight,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    ...Theme.shadows.brand,
  },
  fabInner: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
});
