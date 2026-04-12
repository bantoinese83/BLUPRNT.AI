import React from "react";
import { View, Text } from "react-native";
import { Package, Tag, Boxes } from "lucide-react-native";
import type { ScopeRow } from "@shared/types/database";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";

type BillOfMaterialItem = NonNullable<
  NonNullable<ScopeRow["metadata"]>["materials"]
>[number];

export function ProjectMaterialDetailList({
  materials,
}: {
  materials: NonNullable<ScopeRow["metadata"]>["materials"];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <View style={styles.materialContainer}>
      <View style={styles.materialHeader}>
        <Package size={12} color={Theme.colors.brand.primary} />
        <Text style={styles.materialHeaderText}>Bill of Materials</Text>
      </View>
      <View style={styles.materialGrid}>
        {materials.map((m: BillOfMaterialItem, idx: number) => (
          <View key={idx} style={styles.materialCard}>
            <View style={styles.materialIconBg}>
              <Boxes size={14} color={Theme.colors.text.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{m.name}</Text>
              <View style={styles.materialMetaRow}>
                {m.brand && (
                  <View style={styles.brandTag}>
                    <Tag size={10} color={Theme.colors.brand.primary} />
                    <Text style={styles.brandText}>{m.brand}</Text>
                  </View>
                )}
                {m.quantity && (
                  <Text style={styles.materialQuantity}>
                    {m.quantity} {m.unit || "units"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
