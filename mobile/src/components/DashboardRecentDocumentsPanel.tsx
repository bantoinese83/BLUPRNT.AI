import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { ChevronRight, Clock, Lock, Wallet } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { DocumentThumbnail } from "@/components/DocumentThumbnail";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { money, getWarrantyStatus } from "@shared/lib/formatters";
import { formatRelativeTime } from "@/lib/activity";
import type { InvoiceRow } from "@shared/types/database";

/** Matches Activity feed upload row (opaque tile + spine in gap). */

type Props = {
  invoices: InvoiceRow[];
  estimatedMin: number | null;
  estimatedMax: number | null;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  onOpenInvoice: (invoice: InvoiceRow) => void;
  onOpenLedger: () => void;
  onAddDocument: () => void;
};

export function DashboardRecentDocumentsPanel({
  invoices,
  hasProjectPass,
  onUpgradeClick,
  onOpenInvoice,
  onOpenLedger,
  onAddDocument,
}: Props) {
  const recent = useMemo(
    () =>
      [...invoices]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 3),
    [invoices],
  );

  if (invoices.length > 0) {
    return (
      <GlassCard intensity={10} style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recent Vault Items</Text>
          <View style={styles.sectionHeaderLine} />
        </View>
        <Text style={styles.sectionSubcopy}>
          Open one to check totals or match lines to your plan.
        </Text>

        <View style={styles.rowsWrap} testID="dashboard-recent-documents">
          {recent.map((inv, index) => {
            const warranty = getWarrantyStatus(inv.warranty_expiry_date);
            const isWarrantyUnlocked = hasProjectPass;

            return (
              <Pressable
                key={inv.id}
                testID={`dashboard-recent-doc-row-${index}`}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onOpenInvoice(inv);
                }}
                style={({ pressed }) => [
                  styles.docRow,
                  pressed && styles.docRowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Review ${inv.vendor_name?.trim() || "document"}, ${money(inv.total)}`}
              >
                <DocumentThumbnail invoiceId={inv.id} size={44} />

                <View style={styles.docContent}>
                  <View style={styles.titleRow}>
                    <View style={styles.titleWrap}>
                      <Text style={styles.title} numberOfLines={1}>
                        {inv.vendor_name?.trim() || "Document"}
                      </Text>
                      <ChevronRight
                        size={14}
                        color={Theme.colors.text.muted}
                        style={styles.titleChevron}
                      />
                    </View>
                    <Text style={styles.timeLabel}>
                      {formatRelativeTime(inv.created_at)}
                    </Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLine}>{money(inv.total)}</Text>

                    {warranty &&
                      (isWarrantyUnlocked ? (
                        <View
                          style={[
                            styles.warrantyBadge,
                            {
                              backgroundColor: warranty.isExpired
                                ? "rgba(244, 63, 94, 0.08)"
                                : "rgba(13, 148, 136, 0.08)",
                            },
                          ]}
                        >
                          <Clock
                            size={10}
                            color={
                              warranty.isExpired
                                ? Theme.colors.status.error
                                : Theme.colors.brand.primary
                            }
                          />
                          <Text
                            style={[
                              styles.warrantyText,
                              {
                                color: warranty.isExpired
                                  ? Theme.colors.status.error
                                  : Theme.colors.brand.primary,
                              },
                            ]}
                          >
                            {warranty.label}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={onUpgradeClick}
                          style={styles.lockBadge}
                        >
                          <Lock size={8} color="#d97706" />
                          <Text style={styles.lockText}>Track Warranty</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <TouchableOpacity
          testID="dashboard-open-ledger"
          style={styles.ledgerCta}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenLedger();
          }}
          accessibilityRole="button"
          accessibilityLabel="Open full vault"
          activeOpacity={0.85}
        >
          <Wallet size={18} color={Theme.colors.brand.deep} />
          <View style={styles.ledgerCtaLabelWrap}>
            <Text style={styles.ledgerCtaText}>Open full vault</Text>
          </View>
          <ChevronRight size={18} color={Theme.colors.brand.deep} />
        </TouchableOpacity>
      </GlassCard>
    );
  }

  return (
    <GlassCard intensity={10} style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Vault</Text>
        <View style={styles.sectionHeaderLine} />
      </View>
      <Text style={styles.sectionSubcopy}>
        Upload quotes or invoices here — we pull totals so you can compare to
        your estimate.
      </Text>

      <TouchableOpacity
        testID="dashboard-add-ledger-cta"
        style={styles.primaryCta}
        onPress={() => {
          onAddDocument();
        }}
        accessibilityRole="button"
        accessibilityLabel="Add document to ledger"
        activeOpacity={0.9}
      >
        <Text style={styles.primaryCtaText}>Add document</Text>
        <ChevronRight size={18} color="white" />
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.divider,
    marginLeft: 12,
  },
  sectionSubcopy: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 19,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  rowsWrap: {
    paddingLeft: 4,
  },
  docRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 16,
    alignItems: "flex-start",
  },
  docRowPressed: {
    opacity: 0.72,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  docContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    flexShrink: 1,
  },
  titleChevron: {
    marginTop: 1,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fffbeb", // Amber-50
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#fde68a", // Amber-200
  },
  aiText: {
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: "#d97706", // Amber-600
    textTransform: "uppercase",
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountLine: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
  warrantyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warrantyText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    textTransform: "uppercase",
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lockText: {
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: "#d97706",
    textTransform: "uppercase",
  },
  ledgerCta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.brand.primary,
    backgroundColor: "rgba(13, 148, 136, 0.06)",
    gap: 10,
  },
  ledgerCtaLabelWrap: {
    flex: 1,
    alignItems: "center",
  },
  ledgerCtaText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.deep,
  },
  primaryCta: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Theme.colors.brand.primary,
  },
  primaryCtaText: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
});
