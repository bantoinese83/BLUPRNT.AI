import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { X, Plus } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Theme } from "../constants/Theme";

const PHASE_ORDER = [
  "Site Prep",
  "Demolition",
  "Structural",
  "Rough-in",
  "Drywall",
  "Finishes",
  "Fixtures",
  "Appliances",
  "Cleanup",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    category: string;
    description: string;
    phase: string;
    cost: number;
    quantity: number;
    unit: string;
  }) => Promise<void>;
}

export function AddScopeItemModal({ isOpen, onClose, onAdd }: Props) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState(PHASE_ORDER[0]);
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ea");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const costNum = parseFloat(cost);
    const qtyNum = parseFloat(quantity);
    if (!category.trim() || isNaN(costNum)) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onAdd({
        category: category.trim(),
        description: description.trim(),
        phase,
        cost: costNum,
        quantity: isNaN(qtyNum) ? 1 : qtyNum,
        unit: unit.trim() || "ea",
      });
      setCategory("");
      setDescription("");
      setCost("");
      setQuantity("1");
      setUnit("ea");
      onClose();
    } catch (err) {
      console.error("Add item error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <MotiView
            from={{ translateY: 300, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 300, opacity: 0 }}
            style={styles.sheet}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Add Line Item</Text>
                <Text style={styles.subtitle}>Manual Budget Entry</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Item Name *</Text>
                  <TextInput
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g. Custom Cabinetry"
                    placeholderTextColor={Theme.colors.text.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Phase</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.phaseScroll}
                      >
                        {PHASE_ORDER.map((p) => (
                          <TouchableOpacity
                            key={p}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setPhase(p);
                            }}
                            style={[
                              styles.phaseChip,
                              phase === p && styles.phaseChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.phaseChipText,
                                phase === p && styles.phaseChipTextActive,
                              ]}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Unit Cost ($) *</Text>
                    <TextInput
                      value={cost}
                      onChangeText={setCost}
                      placeholder="0.00"
                      placeholderTextColor={Theme.colors.text.muted}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.inputGroup, { width: 100 }]}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description (Optional)</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add more detail..."
                    placeholderTextColor={Theme.colors.text.muted}
                    multiline
                    numberOfLines={2}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={saving || !category.trim() || !cost}
                  style={[
                    styles.submitBtn,
                    (saving || !category.trim() || !cost) &&
                      styles.submitBtnDisabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Plus size={20} color="white" />
                      <Text style={styles.submitBtnText}>Add to Budget</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </MotiView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: "90%",
  },
  sheet: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  title: {
    fontSize: Theme.typography.size.xl,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    // Standardized touch target (44x44)
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  content: {
    padding: Theme.spacing.xl,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  pickerContainer: {
    marginHorizontal: -24,
  },
  phaseScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  phaseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.divider,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  phaseChipActive: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: Theme.colors.brand.primary,
  },
  phaseChipText: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
  phaseChipTextActive: {
    color: "white",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Theme.colors.brand.primary,
    paddingVertical: 18,
    borderRadius: Theme.radius.lg,
    marginTop: 10,
    ...Theme.shadows.brand,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 17,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
});
