import React, { useCallback } from "react";
import { Tabs } from "expo-router/tabs";

import { useDashboardData } from "@/hooks/useDashboardData";
import { AwarenessProvider } from "@/contexts/AwarenessProvider";
import { useAwareness } from "@/contexts/AwarenessContext";
import { InsightsDrawer } from "@/components/InsightsDrawer";
import { UpgradeModal } from "@/components/UpgradeModal";
import { NotchedTabBar } from "@/components/NotchedTabBar";

/**
 * Bottom clearance for scroll content (notched bar + FAB overlap).
 * Dock is flush to screen edges; `TAB_BAR_HEIGHT` includes former floating margin
 * so scroll padding still clears the center FAB.
 */
export const TAB_BAR_HEIGHT = 90;
export const TAB_BAR_MARGIN = 0;

function TabShell() {
  return (
    <Tabs
      tabBar={(props) => <NotchedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingHorizontal: 0,
          marginHorizontal: 0,
          paddingTop: 0,
          paddingBottom: 0,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="finance" options={{ title: "Finance" }} />
      <Tabs.Screen name="new" options={{ title: "Add" }} />
      <Tabs.Screen name="ai" options={{ title: "Assistant" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="projects" options={{ href: null }} />
    </Tabs>
  );
}

function TabOverlays() {
  const { showUpgrade, setShowUpgrade, upgradeReason } = useAwareness();

  const handleCloseUpgrade = useCallback(() => {
    setShowUpgrade(false);
  }, [setShowUpgrade]);

  return (
    <>
      <InsightsDrawer />
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={handleCloseUpgrade}
        reason={upgradeReason || "general"}
      />
    </>
  );
}

export default function TabLayout() {
  const { project, scopeItems, invoices, spendByCategory } = useDashboardData();

  return (
    <AwarenessProvider
      project={project}
      scopeItems={scopeItems}
      invoices={invoices}
      spendByCategory={spendByCategory}
    >
      <TabShell />
      <TabOverlays />
    </AwarenessProvider>
  );
}
