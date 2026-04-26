import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Package, Tag, Boxes, Pencil, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import {
  BillOfMaterialEditModal,
  type BillOfMaterialRow,
} from "./BillOfMaterialEditModal";

import { type BillOfMaterialItem } from "@shared/types/onboarding";

type MaterialsList = BillOfMaterialItem[];

type Props = {
  materials: MaterialsList;
  onPersist?: (next: MaterialsList) => Promise<void>;
};

export function ProjectBillOfMaterialsList({ materials, onPersist }: Props) {
  const [editItem, setEditItem] = useState<{
    index: number;
    row: BillOfMaterialRow;
  } | null>(null);
  const [persisting, setPersisting] = useState(false);

  const runPersist = useCallback(
    async (next: MaterialsList) => {
      if (!onPersist) return;
      setPersisting(true);
      try {
        await onPersist(next);
      } finally {
        setPersisting(false);
      }
    },
    [onPersist],
  );

  const confirmRemove = useCallback(
    (index: number, label: string) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Remove material",
        `Remove “${label}” from your list? You can always add a custom line item to the plan from the + button.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              const next = materials.filter((_, i) => i !== index);
              void runPersist(next);
            },
          },
        ],
      );
    },
    [materials, runPersist],
  );

  const handleSaveEdited = useCallback(
    async (updated: BillOfMaterialRow) => {
      if (!editItem) return;
      const next = materials.map((m, i) =>
        i === editItem.index ? updated : m,
      );
      await runPersist(next);
    },
    [editItem, materials, runPersist],
  );

  if (!materials) return null;

  return (
    <View style={styles.materialContainer}>
      <View style={styles.materialHeader}>
        <Package size={12} color={Theme.colors.brand.primary} />
        <Text style={styles.materialHeaderText}>Bill of Materials</Text>
        <View style={styles.materialHeaderSpacer} />
        {persisting ? (
          <ActivityIndicator size="small" color={Theme.colors.brand.primary} />
        ) : null}
      </View>

      {materials.length === 0 ? (
        <Text style={styles.materialEmptyText}>
          No materials listed here yet. Use the + button on this screen to add
          anything missing from your plan.
        </Text>
      ) : (
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
            {onPersist && <View style={{ width: 44 }} />}
          </View>

          {materials.map((m: BillOfMaterialRow, idx: number) => (
            <View
              key={`${m.name}-${idx}`}
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

              {onPersist ? (
                <View style={styles.materialColActions}>
                  <TouchableOpacity
                    disabled={persisting}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setEditItem({ index: idx, row: m });
                    }}
                  >
                    <Pencil size={14} color={Theme.colors.brand.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={persisting}
                    onPress={() => confirmRemove(idx, m.name)}
                  >
                    <Trash2 size={14} color={Theme.colors.status.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 12, alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: Theme.colors.status.success,
            }}
          />
          <Text
            style={{
              fontSize: 9,
              fontFamily: Theme.typography.family.bold,
              color: Theme.colors.text.muted,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Quantities grounded in regional waste factors
          </Text>
        </View>
      </View>

      {onPersist ? (
        <BillOfMaterialEditModal
          visible={editItem != null}
          item={editItem?.row ?? null}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdited}
        />
      ) : null}
    </View>
  );
}
