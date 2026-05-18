import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { HomeSpecsTab } from "@/features/finance-tab/HomeSpecsTab";
import { Theme } from "@/constants/Theme";
import { FINANCE_TAB_BAR_OFFSET } from "@/features/finance-tab/constants";

interface HomeSpecsViewProps {
  projectId: string;
  onAddAsset: () => void;
}

export function HomeSpecsView({ projectId, onAddAsset }: HomeSpecsViewProps) {
  return (
    <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
      <HomeSpecsTab projectId={projectId} onAddSpec={onAddAsset} />
      <TouchableOpacity
        onPress={onAddAsset}
        testID="add-spec-fab"
        accessibilityRole="button"
        accessibilityLabel="Add home spec"
        accessibilityHint="Opens the form to save paint, tile, or hardware details"
        style={{
          position: "absolute",
          bottom: FINANCE_TAB_BAR_OFFSET + 20,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Theme.colors.brand.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: Theme.colors.brand.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
