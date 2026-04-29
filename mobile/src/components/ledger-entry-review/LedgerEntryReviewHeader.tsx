import React, { createElement } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { X, ShieldCheck } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { rowIconForLedgerDocumentType } from "@/lib/ledger-type-icons";
import { DEFAULT_DOC_ICON } from "./constants";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";

export type LedgerEntryReviewHeaderProps = {
  ledgerDocType: string;
  isUnverified: boolean;
  onClose: () => void;
};

export function LedgerEntryReviewHeader({
  ledgerDocType,
  isUnverified,
  onClose,
}: LedgerEntryReviewHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <View style={styles.docIconContainer}>
          {createElement(
            rowIconForLedgerDocumentType(ledgerDocType) ?? DEFAULT_DOC_ICON,
            {
              size: 28,
              color: Theme.colors.brand.primary,
            },
          )}
        </View>
        {isUnverified && (
          <View style={styles.aiBadgeHeader}>
            <ShieldCheck size={10} color="#d97706" />
            <Text style={styles.aiTextHeader}>AI Draft</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <X size={20} color={Theme.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}
