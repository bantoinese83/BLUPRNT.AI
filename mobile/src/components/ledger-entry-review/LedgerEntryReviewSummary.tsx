import React from "react";
import { View, Text } from "react-native";
import { Sparkles } from "lucide-react-native";
import type { ledgerDocumentTheme } from "@shared/lib/ledger-document-labels";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";

export type LedgerEntryReviewSummaryProps = {
  aiSummary: string;
  isProcessing: boolean;
  theme: ReturnType<typeof ledgerDocumentTheme>;
};

export function LedgerEntryReviewSummary({
  aiSummary,
  isProcessing,
  theme,
}: LedgerEntryReviewSummaryProps) {
  if (!aiSummary && !isProcessing) return null;

  return (
    <View
      style={[
        styles.summaryBox,
        {
          backgroundColor: theme.colors?.bg,
          borderColor: theme.colors?.border,
        },
      ]}
    >
      <Sparkles size={20} color={theme.colors?.icon} />
      <Text style={[styles.summaryText, { color: theme.colors?.icon + "cc" }]}>
        {aiSummary ? (
          aiSummary
        ) : (
          <Text
            style={[styles.summaryAnalyzing, { color: theme.colors?.icon }]}
          >
            Analyzing Document...
          </Text>
        )}
      </Text>
    </View>
  );
}
