import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FileText, Calendar, Building2 } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { money } from "@shared/lib/formatters";
import type { LedgerEntryRow, LedgerLineItemRow } from "@shared/types/database";

type LedgerEntryWithLines = LedgerEntryRow & {
  ledger_line_items: LedgerLineItemRow[];
};

type Props = {
  scopeItemId: string;
  ledgerEntries: LedgerEntryRow[];
};

export const ReconciledDocumentsList = ({
  scopeItemId,
  ledgerEntries,
}: Props) => {
  // Find all line items that match this scope item
  const reconciledLines = ledgerEntries.flatMap((entry) => {
    const lines = (entry as unknown as LedgerEntryWithLines).ledger_line_items;
    if (!lines) return [];

    return lines
      .filter((line) => line.scope_item_id === scopeItemId)
      .map((line) => ({
        ...line,
        vendor_name: entry.vendor_name,
        issue_date: entry.issue_date || entry.created_at,
        document_id: entry.id,
      }));
  });

  if (reconciledLines.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FileText size={12} color={Theme.colors.text.secondary} />
        <Text style={styles.headerText}>RECONCILED SPEND</Text>
      </View>

      {reconciledLines.map((line, idx) => (
        <View key={`${line.document_id}-${idx}`} style={styles.row}>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorHeader}>
              <Building2 size={10} color={Theme.colors.text.primary} />
              <Text style={styles.vendorName}>
                {line.vendor_name || "Unknown Vendor"}
              </Text>
            </View>
            <View style={styles.dateInfo}>
              <Calendar size={10} color={Theme.colors.text.secondary} />
              <Text style={styles.dateText}>
                {new Date(line.issue_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Text style={styles.amount}>{money(line.line_total)}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.secondary,
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  vendorInfo: {
    flex: 1,
    gap: 2,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vendorName: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  amount: {
    fontSize: 13,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    textAlign: "right",
  },
});
