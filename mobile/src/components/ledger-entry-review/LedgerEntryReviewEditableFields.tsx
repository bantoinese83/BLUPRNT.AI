import React from "react";
import { View, Text, TextInput } from "react-native";
import { Theme } from "@/constants/Theme";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";
import type { ledgerDocumentTheme } from "@shared/lib/ledger-document-labels";
import type { LedgerDocumentType } from "@shared/lib/infer-document-type";
import {
  ledgerReviewAmountFieldMode,
  ledgerReviewDateFieldsForType,
  ledgerReviewSummaryHint,
  ledgerReviewSummaryPlaceholder,
  ledgerReviewTotalAmountHint,
  ledgerReviewTotalAmountLabel,
  type LedgerReviewDateFieldKey,
} from "@shared/lib/document-review-form-config";

export type LedgerEntryReviewEditableFieldsProps = {
  ledgerDocType: LedgerDocumentType;
  theme: ReturnType<typeof ledgerDocumentTheme>;
  vendorName: string;
  setVendorName: (v: string) => void;
  totalValue: string;
  setTotalValue: (v: string) => void;
  aiSummary: string;
  setAiSummary: (v: string) => void;
  reviewDates: Record<LedgerReviewDateFieldKey, string>;
  onReviewDateChange: (key: LedgerReviewDateFieldKey, value: string) => void;
};

export function LedgerEntryReviewEditableFields({
  ledgerDocType,
  theme,
  vendorName,
  setVendorName,
  totalValue,
  setTotalValue,
  aiSummary,
  setAiSummary,
  reviewDates,
  onReviewDateChange,
}: LedgerEntryReviewEditableFieldsProps) {
  const amountMode = ledgerReviewAmountFieldMode(ledgerDocType);
  const totalLabel = ledgerReviewTotalAmountLabel(ledgerDocType);
  const totalHint = ledgerReviewTotalAmountHint(ledgerDocType);
  const summaryPlaceholder = ledgerReviewSummaryPlaceholder(ledgerDocType);
  const summaryHint = ledgerReviewSummaryHint(ledgerDocType);
  const dateFields = ledgerReviewDateFieldsForType(ledgerDocType);

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

      {amountMode !== "hidden" && totalLabel ? (
        <View style={styles.editableField}>
          <Text style={styles.editableLabel}>{totalLabel}</Text>
          <TextInput
            style={styles.editableInput}
            value={totalValue}
            onChangeText={setTotalValue}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Theme.colors.text.muted}
          />
          <Text style={styles.editableHint}>{totalHint}</Text>
        </View>
      ) : null}

      <View style={styles.editableField}>
        <Text style={styles.editableLabel}>Document summary</Text>
        <TextInput
          style={[styles.editableInput, styles.editableInputMultiline]}
          value={aiSummary}
          onChangeText={setAiSummary}
          multiline
          placeholder={summaryPlaceholder}
          placeholderTextColor={Theme.colors.text.muted}
        />
        <Text style={styles.editableHint}>{summaryHint}</Text>
      </View>

      {dateFields.map((field) => (
        <View key={field.key} style={styles.editableField}>
          <Text style={styles.editableLabel}>{field.label}</Text>
          <TextInput
            style={styles.editableInput}
            value={reviewDates[field.key]}
            onChangeText={(v) => onReviewDateChange(field.key, v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Theme.colors.text.muted}
          />
          <Text style={styles.editableHint}>{field.hint}</Text>
        </View>
      ))}
    </>
  );
}
