import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import {
  getLedgerUploadBlockReason,
  type LedgerUploadBlockReason,
} from "@shared/lib/ledger-upload-client-gate";
import { ledgerUploadLimitUiCopy } from "@shared/lib/ledger-upload-ui-copy";
import type {
  LedgerEntryRow,
  UserSubscriptionRow,
} from "@shared/types/database";

type Props = {
  ledgerEntries: LedgerEntryRow[];
  isArchitect: boolean;
  hasProjectPass: boolean;
  revenueCatPro?: boolean;
  subscription?: UserSubscriptionRow | null;
  onUpgrade: () => void;
  /** When set, skips recomputing block reason (e.g. parent already checked). */
  blockReason?: LedgerUploadBlockReason;
};

export function LedgerUploadLimitBanner({
  ledgerEntries,
  isArchitect,
  hasProjectPass,
  revenueCatPro,
  subscription,
  onUpgrade,
  blockReason: blockReasonProp,
}: Props) {
  const blockReason =
    blockReasonProp ??
    getLedgerUploadBlockReason(ledgerEntries, {
      isArchitect,
      hasProjectPass,
      revenueCatPro,
      subscription,
    });

  const copy = ledgerUploadLimitUiCopy(blockReason);
  if (!copy) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.row}>
        <AlertTriangle
          size={18}
          color={Theme.colors.status.warning}
          style={styles.icon}
        />
        <View style={styles.textCol}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <Text style={styles.hint}>{copy.quotaHint}</Text>
        </View>
      </View>
      <Button
        title={copy.cta}
        titleCase="sentence"
        onPress={onUpgrade}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  body: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
  hint: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    lineHeight: 17,
  },
  cta: {
    alignSelf: "stretch",
  },
});
