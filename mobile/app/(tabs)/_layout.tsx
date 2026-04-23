import React, { useCallback } from "react";
import { Tabs } from "expo-router/tabs";

import { useDashboardData } from "@/hooks/useDashboardData";
import { AwarenessProvider } from "@/contexts/AwarenessProvider";
import { useAwareness } from "@/contexts/AwarenessContext";
import { InsightsDrawer } from "@/components/InsightsDrawer";
import { UpgradeModal } from "@/components/UpgradeModal";
import { FloatingGlassBar } from "@/components/FloatingGlassBar";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";

/**
 * Bottom clearance for scroll content lives in `@/constants/Layout` (`TAB_BAR_SCROLL_PADDING`).
 * Dock is flush to screen edges; tab bar height includes clearance for the center FAB.
 */

function TabShell() {
  return (
    <Tabs
      tabBar={(props) => <FloatingGlassBar {...props} />}
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
      <Tabs.Screen name="finance" options={{ title: "Ledger" }} />
      <Tabs.Screen name="new" options={{ title: "New" }} />
      <Tabs.Screen name="ai" options={{ title: "Ask" }} />
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
      <ComponentErrorBoundary name="AI Insights">
        <InsightsDrawer />
      </ComponentErrorBoundary>
      <ComponentErrorBoundary name="Payments">
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={handleCloseUpgrade}
          reason={upgradeReason || "general"}
        />
      </ComponentErrorBoundary>
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
