import React from "react";
import { View, Text, TextInput } from "react-native";
import { Theme } from "@/constants/Theme";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";
import type { ledgerDocumentTheme } from "@shared/lib/ledger-document-labels";

export type LedgerEntryReviewEditableFieldsProps = {
  theme: ReturnType<typeof ledgerDocumentTheme>;
  vendorName: string;
  setVendorName: (v: string) => void;
  totalValue: string;
  setTotalValue: (v: string) => void;
  aiSummary: string;
  setAiSummary: (v: string) => void;
};

export function LedgerEntryReviewEditableFields({
  theme,
  vendorName,
  setVendorName,
  totalValue,
  setTotalValue,
  aiSummary,
  setAiSummary,
}: LedgerEntryReviewEditableFieldsProps) {
  return (
    <>
      <View style={styles.editableField}>
        <Text style={styles.editableLabel}>{theme.label}</Text>
        <TextInput
          style={styles.editableInput}
          value={vendorName}
          onChangeText={setVendorName}
          placeholder="e.g. Home Depot"
          placeholderTextColor={Theme.colors.text.muted}
        />
      </View>

      <View style={styles.editableField}>
        <Text style={styles.editableLabel}>Total Amount ($)</Text>
        <TextInput
          style={styles.editableInput}
          value={totalValue}
          onChangeText={setTotalValue}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={Theme.colors.text.muted}
        />
      </View>

      <View style={styles.editableField}>
        <Text style={styles.editableLabel}>Document Summary</Text>
        <TextInput
          style={[styles.editableInput, styles.editableInputMultiline]}
          value={aiSummary}
          onChangeText={setAiSummary}
          multiline
          placeholder="e.g. Purchase of premium roofing materials..."
          placeholderTextColor={Theme.colors.text.muted}
        />
        <Text style={styles.editableHint}>
          A brief description of what was purchased or documented. Used by AI
          for project insights.
        </Text>
      </View>
    </>
  );
}
