import React from "react";
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import {
  LayoutDashboard,
  Receipt,
  Plus,
  MessageSquare,
  User,
} from "lucide-react-native";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDashboardData } from "../../src/hooks/useDashboardData";
import { AwarenessProvider } from "../../src/contexts/AwarenessProvider";
import { useAwareness } from "../../src/contexts/AwarenessContext";
import { InsightsDrawer } from "../../src/components/InsightsDrawer";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { Theme } from "../../src/constants/Theme";

// Exported so ScreenWrapper can read it for bottom padding
export const TAB_BAR_HEIGHT = 68;
export const TAB_BAR_MARGIN = 16;

function TabContent() {
  const insets = useSafeAreaInsets();
  const { showUpgrade, setShowUpgrade, upgradeReason } = useAwareness();

  // Distance from physical screen bottom to bottom of tab bar
  const bottomOffset = (insets.bottom > 0 ? insets.bottom : 0) + TAB_BAR_MARGIN;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Theme.colors.brand.primary,
          tabBarInactiveTintColor: Theme.colors.text.muted,
          tabBarStyle: {
            position: "absolute",
            bottom: bottomOffset,
            left: TAB_BAR_MARGIN,
            right: TAB_BAR_MARGIN,
            height: TAB_BAR_HEIGHT,
            // No background or border — provided by tabBarBackground
            borderTopWidth: 0,
            backgroundColor: "transparent",
            elevation: 0,
            // Shadow lives here (outside the overflow-hidden background clip)
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
          },
          tabBarItemStyle: {
            height: TAB_BAR_HEIGHT,
            paddingBottom: Platform.OS === "ios" ? 6 : 4,
          },
          tabBarBackground: () => (
            // overflow: hidden clips BlurView to pill shape
            <View style={styles.tabBarBg}>
              <BlurView
                intensity={85}
                tint="light"
                style={StyleSheet.absoluteFillObject}
              />
              {/* Extra white tint so content below doesn't bleed through */}
              <View
                style={[StyleSheet.absoluteFillObject, styles.tabBarOverlay]}
              />
            </View>
          ),
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontFamily: Theme.typography.family.semibold,
            fontSize: Theme.typography.size.xs,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <MotiView
                animate={{ scale: focused ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <LayoutDashboard
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 1.8}
                />
              </MotiView>
            ),
          }}
        />

        <Tabs.Screen
          name="finance"
          options={{
            title: "Finance",
            tabBarIcon: ({ color, focused }) => (
              <MotiView
                animate={{ scale: focused ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Receipt
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 1.8}
                />
              </MotiView>
            ),
          }}
        />

        {/* Centre FAB — floats above the pill via negative marginBottom */}
        <Tabs.Screen
          name="new"
          options={{
            title: "",
            tabBarLabel: () => null,
            tabBarIcon: ({ focused }) => (
              <MotiView
                animate={{ scale: focused ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={styles.fab}
              >
                <Plus size={30} color="white" strokeWidth={2.5} />
              </MotiView>
            ),
          }}
        />

        <Tabs.Screen
          name="ai"
          options={{
            title: "Assistant",
            tabBarIcon: ({ color, focused }) => (
              <MotiView
                animate={{ scale: focused ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <MessageSquare
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 1.8}
                />
              </MotiView>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <MotiView
                animate={{ scale: focused ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <User
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 1.8}
                />
              </MotiView>
            ),
          }}
        />

        {/* Hidden from tab bar — navigable as a stack screen */}
        <Tabs.Screen
          name="projects"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <InsightsDrawer />
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason || "general"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.07)",
  },
  tabBarOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Theme.colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    // Float above the pill: negative marginBottom lifts the icon upward within
    // the tab item. Value chosen so top edge of circle clears the pill top.
    marginBottom: Platform.OS === "ios" ? 24 : 30,
    // Brand shadow
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    // White ring border
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
});

export default function TabLayout() {
  const { project, scopeItems, invoices } = useDashboardData();

  return (
    <AwarenessProvider
      project={project}
      scopeItems={scopeItems}
      invoices={invoices}
    >
      <TabContent />
    </AwarenessProvider>
  );
}
