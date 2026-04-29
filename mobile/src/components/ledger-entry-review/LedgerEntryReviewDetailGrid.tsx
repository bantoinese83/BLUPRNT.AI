import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, Receipt, ShieldCheck } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { STATUS_COLORS } from "./constants";
import { ledgerDocumentTypeLabel } from "@shared/lib/ledger-document-labels";
import { LedgerEntryReviewDetailRow } from "./LedgerEntryReviewDetailRow";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";
import type { LedgerEntryRow } from "@shared/types/database";
import type { LedgerReviewDocument } from "@shared/types/ledger-review";

export type LedgerEntryReviewDetailGridProps = {
  ledgerEntry: LedgerEntryRow;
  detail: LedgerReviewDocument | null;
  docType: string;
  onOpenDocTypePicker: () => void;
};

export function LedgerEntryReviewDetailGrid({
  ledgerEntry,
  detail,
  docType,
  onOpenDocTypePicker,
}: LedgerEntryReviewDetailGridProps) {
  const statusColor =
    STATUS_COLORS[detail?.payment_status ?? ledgerEntry.payment_status ?? ""] ||
    "#64748b";

  const rawStatus =
    detail?.payment_status ?? ledgerEntry.payment_status ?? "pending";
  const paymentLabel =
    rawStatus === "unknown"
      ? docType === "quote"
        ? "Pending Review"
        : "Processing"
      : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  return (
    <View style={styles.detailGrid}>
      <LedgerEntryReviewDetailRow
        icon={<Calendar size={16} color={Theme.colors.text.secondary} />}
        label="Date"
        value={new Date(ledgerEntry.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />
      <TouchableOpacity
        style={styles.docTypeRow}
        onPress={onOpenDocTypePicker}
        accessibilityRole="button"
        accessibilityLabel="Change document type"
      >
        <View style={styles.docTypeRowLeft}>
          <Receipt size={16} color={Theme.colors.text.secondary} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.detailLabelText}>Document type</Text>
            <Text style={styles.detailValue}>
              {ledgerDocumentTypeLabel(docType)}
            </Text>
          </View>
        </View>
        <Text style={styles.docTypeChange}>Change</Text>
      </TouchableOpacity>
      <LedgerEntryReviewDetailRow
        icon={<ShieldCheck size={16} color={statusColor} />}
        label="Payment Status"
        value={paymentLabel}
        valueColor={statusColor}
      />
    </View>
  );
}
