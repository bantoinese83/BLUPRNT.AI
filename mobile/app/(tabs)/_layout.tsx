import React, { useCallback } from "react";
import { Tabs } from "expo-router/tabs";

import { useDashboardData } from "../../src/hooks/useDashboardData";
import { AwarenessProvider } from "../../src/contexts/AwarenessProvider";
import { useAwareness } from "../../src/contexts/AwarenessContext";
import { InsightsDrawer } from "../../src/components/InsightsDrawer";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { NotchedTabBar } from "../../src/components/NotchedTabBar";

/**
 * Bottom clearance for scroll content (notched bar + FAB overlap + margin).
 */
export const TAB_BAR_HEIGHT = 72;
export const TAB_BAR_MARGIN = 18;

function TabShell() {
  return (
    <Tabs
      tabBar={(props) => <NotchedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
  const { project, scopeItems, invoices } = useDashboardData();

  return (
    <AwarenessProvider
      project={project}
      scopeItems={scopeItems}
      invoices={invoices}
    >
      <TabShell />
      <TabOverlays />
    </AwarenessProvider>
  );
}
