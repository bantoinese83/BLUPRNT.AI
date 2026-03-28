import React from "react";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import {
  LayoutDashboard,
  MessageSquare,
  Folder,
  User,
  Receipt,
  Wallet,
  Plus,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDashboardData } from "../../src/hooks/useDashboardData";
import {
  AwarenessProvider,
  useAwareness,
} from "../../src/contexts/AwarenessProvider";
import { InsightsDrawer } from "../../src/components/InsightsDrawer";
import { UpgradeModal } from "../../src/components/UpgradeModal";

function TabContent() {
  const insets = useSafeAreaInsets();
  const { showUpgrade, setShowUpgrade, upgradeReason } = useAwareness();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#4f46e5",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            backgroundColor: "#0f172a",
            borderTopColor: "rgba(255, 255, 255, 0.1)",
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 12,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <LayoutDashboard size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="finance"
          options={{
            title: "Finance",
            tabBarIcon: ({ color }) => <Receipt size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="new"
          options={{
            title: "New",
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: "#4f46e5",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: Platform.OS === "ios" ? 20 : 30, // Elevated center action
                  shadowColor: "#4f46e5",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 15,
                  elevation: 8,
                  borderWidth: 2,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <Plus size={30} color="white" />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="ai"
          options={{
            title: "Assistant",
            tabBarIcon: ({ color }) => (
              <MessageSquare size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />

        {/* Hide original projects tab from bar */}
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
