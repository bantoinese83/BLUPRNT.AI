import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { showAppToast } from "@/lib/app-toast";
import type { ScopeRow } from "@shared/types/database";

export type BillOfMaterialRow = NonNullable<
  NonNullable<ScopeRow["metadata"]>["materials"]
>[number];

type Props = {
  visible: boolean;
  item: BillOfMaterialRow | null;
  onClose: () => void;
  onSave: (next: BillOfMaterialRow) => Promise<void>;
};

export function BillOfMaterialEditModal({
  visible,
  item,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !item) return;
    setName(item.name ?? "");
    setBrand(item.brand ?? "");
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUnit(item.unit ?? "");
    setEstimatedCost(
      item.estimated_cost != null ? String(item.estimated_cost) : "",
    );
  }, [visible, item]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showAppToast("Add a short name for this material.");
      return;
    }
    const qtyRaw = quantity.trim().replace(/,/g, "");
    let qtyNum: number | undefined;
    if (qtyRaw.length > 0) {
      const n = Number.parseFloat(qtyRaw);
      if (!Number.isFinite(n) || n < 0) {
        showAppToast("Enter a valid quantity, or leave it blank.");
        return;
      }
      qtyNum = n;
    }

    const costRaw = estimatedCost.trim().replace(/[$,]/g, "");
    let costNum: number | undefined;
    if (costRaw.length > 0) {
      const n = Number.parseFloat(costRaw);
      if (!Number.isFinite(n) || n < 0) {
        showAppToast("Enter a valid unit cost, or leave it blank.");
        return;
      }
      costNum = n;
    }

    setSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const next: BillOfMaterialRow = {
        ...item!,
        name: trimmedName,
        brand: brand.trim() || undefined,
        quantity: qtyNum,
        unit: unit.trim() || undefined,
        estimated_cost: costNum,
      };
      await onSave(next);
      onClose();
    } catch {
      showAppToast(
        "Couldn’t save this item. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit material</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={22} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Adjust what you already have on hand so your list matches reality.
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="e.g. Roofing nails"
            placeholderTextColor={Theme.colors.text.muted}
            editable={!saving}
            accessibilityLabel="Material name"
          />

          <View style={styles.row2}>
            <View style={styles.row2Col}>
              <Text style={styles.label}>Brand (optional)</Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                style={styles.input}
                placeholder="Brand or grade"
                placeholderTextColor={Theme.colors.text.muted}
                editable={!saving}
                accessibilityLabel="Brand"
              />
            </View>
            <View style={styles.row2Col}>
              <Text style={styles.label}>Unit Cost ($)</Text>
              <TextInput
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={Theme.colors.text.muted}
                editable={!saving}
                accessibilityLabel="Unit cost"
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.row2Col}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                placeholderTextColor={Theme.colors.text.muted}
                editable={!saving}
                accessibilityLabel="Quantity"
              />
            </View>
            <View style={styles.row2Col}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                style={styles.input}
                placeholder="box, sq ft…"
                placeholderTextColor={Theme.colors.text.muted}
                editable={!saving}
                accessibilityLabel="Unit"
              />
            </View>
          </View>

          <View style={styles.actions}>
            {saving ? (
              <View style={styles.loaderRow}>
                <SnurraLoader size={SnurraSize.compact} />
              </View>
            ) : (
              <>
                <Button
                  title="Save Changes"
                  onPress={() => void handleSave()}
                />
                <Button title="Cancel" variant="outline" onPress={onClose} />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  closeBtn: {
    padding: 6,
  },
  hint: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.inputBg,
  },
  row2: {
    flexDirection: "row",
    gap: 12,
  },
  row2Col: {
    flex: 1,
  },
  actions: {
    marginTop: 22,
    gap: 10,
  },
  loaderRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
});
