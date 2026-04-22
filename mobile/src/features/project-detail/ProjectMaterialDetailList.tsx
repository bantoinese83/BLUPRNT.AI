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
import type { ScopeRow } from "@shared/types/database";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import {
  BillOfMaterialEditModal,
  type BillOfMaterialRow,
} from "./BillOfMaterialEditModal";

type MaterialsList = NonNullable<
  NonNullable<ScopeRow["metadata"]>["materials"]
>;

type Props = {
  materials: MaterialsList;
  onPersist?: (next: MaterialsList) => Promise<void>;
};

export function ProjectMaterialDetailList({ materials, onPersist }: Props) {
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
          {materials.map((m: BillOfMaterialRow, idx: number) => (
            <View key={`${m.name}-${idx}`} style={styles.materialCard}>
              <View style={styles.materialIconBg}>
                <Boxes size={14} color={Theme.colors.text.muted} />
              </View>
              <TouchableOpacity
                style={styles.materialBody}
                activeOpacity={0.75}
                disabled={!onPersist || persisting}
                onPress={() => {
                  if (!onPersist || persisting) return;
                  void Haptics.selectionAsync();
                  setEditItem({ index: idx, row: m });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${m.name}`}
              >
                <Text style={styles.materialName}>{m.name}</Text>
                <View style={styles.materialMetaRow}>
                  {m.brand ? (
                    <View style={styles.brandTag}>
                      <Tag size={10} color={Theme.colors.brand.primary} />
                      <Text style={styles.brandText}>{m.brand}</Text>
                    </View>
                  ) : null}
                  {m.quantity != null ? (
                    <Text style={styles.materialQuantity}>
                      {m.quantity} {m.unit || "units"}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              {onPersist ? (
                <View style={styles.materialRowActions}>
                  <TouchableOpacity
                    style={styles.materialIconBtn}
                    disabled={persisting}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setEditItem({ index: idx, row: m });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${m.name}`}
                  >
                    <Pencil size={16} color={Theme.colors.brand.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.materialIconBtn}
                    disabled={persisting}
                    onPress={() => confirmRemove(idx, m.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${m.name}`}
                  >
                    <Trash2 size={16} color={Theme.colors.status.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

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
