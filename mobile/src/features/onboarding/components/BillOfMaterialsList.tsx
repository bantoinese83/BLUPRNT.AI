import React from "react";
import { View, Text } from "react-native";
import { Package, Boxes, Tag } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { onboardingStyles as styles } from "@/features/onboarding/onboarding-screen.styles";

import { type BillOfMaterialItem } from "@shared/types/onboarding";

export function BillOfMaterialsList({
  materials,
}: {
  materials: BillOfMaterialItem[];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <View style={styles.materialContainer}>
      <View style={styles.materialHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Package size={14} color={Theme.colors.brand.primary} />
          <Text style={styles.materialHeaderText}>Bill of Materials</Text>
        </View>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{materials.length} items</Text>
        </View>
      </View>
      <View style={styles.materialGrid}>
        {materials.map((m, idx: number) => (
          <View key={idx} style={styles.materialCardPremium}>
            <View style={styles.materialMainRow}>
              <View style={styles.materialIconBgPremium}>
                <Boxes size={16} color={Theme.colors.brand.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Text style={styles.materialNamePremium} numberOfLines={2}>
                    {m.name}
                  </Text>
                  {m.estimated_cost && (
                    <Text style={styles.materialPrice}>
                      ${m.estimated_cost}
                    </Text>
                  )}
                </View>

                <View style={styles.materialMetaRowPremium}>
                  {m.brand && (
                    <View style={styles.brandTagPremium}>
                      <Tag size={10} color={Theme.colors.brand.primary} />
                      <Text style={styles.brandTextPremium}>{m.brand}</Text>
                    </View>
                  )}
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>
                      {m.quantity} {m.unit || "pc"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
