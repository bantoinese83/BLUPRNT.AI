import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  Package,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldPlus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import { useConfirmation } from "@/contexts/useConfirmation";
import {
  BillOfMaterialEditModal,
  type BillOfMaterialRow,
} from "./BillOfMaterialEditModal";

import { type BillOfMaterialItem } from "@shared/types/onboarding";
import { money } from "@shared/lib/formatters";

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

  const totalBomCost = useMemo(() => {
    if (!materials) return 0;
    return materials.reduce((acc, curr) => {
      const cost = curr.estimated_cost || 0;
      const qty = curr.quantity ? Number(curr.quantity) || 1 : 1;
      return acc + cost * qty;
    }, 0);
  }, [materials]);

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

  const { confirm } = useConfirmation();

  const confirmRemove = useCallback(
    (index: number, label: string) => {
      confirm({
        title: "Remove material?",
        message: `Remove “${label}” from your list? You can always add it back later.`,
        confirmLabel: "Remove",
        variant: "destructive",
        onConfirm: async () => {
          const next = materials.filter((_, i) => i !== index);
          await runPersist(next);
        },
      });
    },
    [confirm, materials, runPersist],
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
        <Package size={14} color={Theme.colors.brand.primary} />
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
              <Text style={styles.materialTableLabel}>Est Total</Text>
            </View>
            {onPersist && <View style={{ width: 44 }} />}
          </View>

          {materials.map((m: BillOfMaterialRow, idx: number) => {
            const qtyNum = m.quantity ? Number(m.quantity) || 1 : 1;
            const lineTotal = m.estimated_cost
              ? m.estimated_cost * qtyNum
              : null;

            return (
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    {m.brand ? (
                      <Text style={styles.materialBrandTable}>{m.brand}</Text>
                    ) : (
                      <Text
                        style={[
                          styles.materialBrandTable,
                          {
                            color: Theme.colors.text.muted,
                            textTransform: "none",
                            fontWeight: "normal",
                          },
                        ]}
                      >
                        Standard Spec
                      </Text>
                    )}
                    {m.model ? (
                      <Text
                        style={{
                          fontSize: 9,
                          color: Theme.colors.text.muted,
                          fontStyle: "italic",
                        }}
                      >
                        {m.model}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.materialColQty}>
                  <Text style={styles.materialQtyTable}>
                    {m.quantity} {m.unit || "pc"}
                  </Text>
                </View>

                <View style={styles.materialColPrice}>
                  {lineTotal != null ? (
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.materialPriceTable}>
                        ${lineTotal}
                      </Text>
                      {qtyNum > 1 && (
                        <Text
                          style={{
                            fontSize: 9,
                            color: Theme.colors.text.muted,
                            fontStyle: "italic",
                            marginTop: 1,
                          }}
                        >
                          ${m.estimated_cost} ea
                        </Text>
                      )}
                    </View>
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
            );
          })}

          {/* BOM Summary Footer */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: "rgba(13, 148, 136, 0.06)",
              borderTopWidth: 1,
              borderTopColor: "rgba(13, 148, 136, 0.12)",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <ShieldCheck size={14} color={Theme.colors.brand.primary} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: Theme.typography.family.bold,
                  color: Theme.colors.brand.deep,
                }}
              >
                Estimated BOM Total ({materials.length} items)
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Theme.typography.family.black,
                color: Theme.colors.brand.primary,
              }}
            >
              {money(totalBomCost)}
            </Text>
          </View>
        </View>
      )}

      <View style={{ marginTop: 12, gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <ShieldPlus size={10} color={Theme.colors.status.info} />
          <Text
            style={{
              fontSize: 9,
              fontFamily: Theme.typography.family.bold,
              color: Theme.colors.status.info,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            +15% Contractor Contingency Reserve Included
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
