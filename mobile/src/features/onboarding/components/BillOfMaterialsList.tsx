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
        {/* Table Header */}
        <View style={styles.materialTableHeader}>
          <View style={styles.materialColMain}>
            <Text style={styles.materialTableLabel}>Material</Text>
          </View>
          <View style={styles.materialColQty}>
            <Text style={styles.materialTableLabel}>Qty</Text>
          </View>
          <View style={styles.materialColPrice}>
            <Text style={styles.materialTableLabel}>Est</Text>
          </View>
        </View>

        {materials.map((m, idx: number) => (
          <View
            key={idx}
            style={[
              styles.materialTableRow,
              idx === materials.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.materialColMain}>
              <Text style={styles.materialNameTable} numberOfLines={1}>
                {m.name}
              </Text>
              {m.brand && (
                <Text style={styles.materialBrandTable}>{m.brand}</Text>
              )}
            </View>

            <View style={styles.materialColQty}>
              <Text style={styles.materialQtyTable}>
                {m.quantity} {m.unit || "pc"}
              </Text>
            </View>

            <View style={styles.materialColPrice}>
              {m.estimated_cost ? (
                <Text style={styles.materialPriceTable}>
                  ${m.estimated_cost}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.materialPriceTable,
                    { color: Theme.colors.text.muted },
                  ]}
                >
                  —
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
