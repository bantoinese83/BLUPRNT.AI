import React from "react";
import { Platform, useColorScheme } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

import { useDashboardData } from "../../src/hooks/useDashboardData";
import { AwarenessProvider } from "../../src/contexts/AwarenessProvider";
import { useAwareness } from "../../src/contexts/AwarenessContext";
import { InsightsDrawer } from "../../src/components/InsightsDrawer";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { Theme } from "../../src/constants/Theme";

/**
 * Bottom clearance for scroll content (native tab bar + margin).
 * Native liquid tab bar is shorter than the old custom floating pill + FAB.
 */
export const TAB_BAR_HEIGHT = 52;
export const TAB_BAR_MARGIN = 20;

/** Icons must be direct children of `Trigger` — wrappers break `child.type === Icon` detection. */
function TabContent() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { showUpgrade, setShowUpgrade, upgradeReason } = useAwareness();

  const backgroundColor =
    Platform.OS === "ios"
      ? "transparent"
      : isDark
        ? "#000000"
        : Theme.colors.background;

  const indicatorColor = isDark ? "#2E3135" : "#E0E1E6";

  const selectedLabelColor = isDark ? "#f8fafc" : Theme.colors.text.primary;

  return (
    <>
      <NativeTabs
        backgroundColor={backgroundColor}
        indicatorColor={indicatorColor}
        labelStyle={{
          selected: {
            color: selectedLabelColor,
            fontWeight: "700",
          },
        }}
        iconColor={{
          default: Theme.colors.text.muted,
          selected: Theme.colors.brand.primary,
        }}
        tintColor={Theme.colors.brand.primary}
      >
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon
            sf="house.fill"
            androidSrc={<VectorIcon family={MaterialIcons} name="home" />}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="finance">
          <Label>Finance</Label>
          <Icon
            sf="creditcard.fill"
            androidSrc={
              <VectorIcon
                family={MaterialIcons}
                name="account-balance-wallet"
              />
            }
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="new">
          <Label>Add</Label>
          <Icon
            sf="plus.circle.fill"
            androidSrc={<VectorIcon family={MaterialIcons} name="add-circle" />}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="ai">
          <Label>Assistant</Label>
          <Icon
            sf="sparkles"
            androidSrc={
              <VectorIcon family={MaterialIcons} name="auto-awesome" />
            }
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Label>Profile</Label>
          <Icon
            sf="person.crop.circle.fill"
            androidSrc={<VectorIcon family={MaterialIcons} name="person" />}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="projects" hidden />
      </NativeTabs>

      <InsightsDrawer />
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
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
      <TabContent />
    </AwarenessProvider>
  );
}
