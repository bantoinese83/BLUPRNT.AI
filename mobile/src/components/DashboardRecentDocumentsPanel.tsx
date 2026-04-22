import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { ChevronRight, Receipt, Wallet } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { money } from "@shared/lib/formatters";
import { formatRelativeTime } from "@/lib/activity";
import type { InvoiceRow } from "@shared/types/database";

/** Matches Activity feed upload row (opaque tile + spine in gap). */
const DOC_ICON = {
  text: "#2563eb",
  bg: "#eff6ff",
  border: "#bfdbfe",
} as const;

type Props = {
  invoices: InvoiceRow[];
  estimatedMin: number | null;
  estimatedMax: number | null;
  onOpenInvoice: (invoice: InvoiceRow) => void;
  onOpenLedger: () => void;
  onAddDocument: () => void;
};

export function DashboardRecentDocumentsPanel({
  invoices,
  estimatedMin,
  estimatedMax,
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

  const hasEstimate =
    (estimatedMin != null && Number.isFinite(estimatedMin)) ||
    (estimatedMax != null && Number.isFinite(estimatedMax));

  if (invoices.length > 0) {
    return (
      <GlassCard intensity={10} style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recent documents</Text>
          <View style={styles.sectionHeaderLine} />
        </View>
        <Text style={styles.sectionSubcopy}>
          Open one to check totals or match lines to your plan.
        </Text>

        <View style={styles.rowsWrap} testID="dashboard-recent-documents">
          {recent.map((inv, index) => (
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
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: DOC_ICON.bg,
                    borderColor: DOC_ICON.border,
                  },
                ]}
              >
                <Receipt size={20} color={DOC_ICON.text} />
              </View>

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
                <Text style={styles.amountLine}>{money(inv.total)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <TouchableOpacity
          testID="dashboard-open-ledger"
          style={styles.ledgerCta}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenLedger();
          }}
          accessibilityRole="button"
          accessibilityLabel="Open full ledger"
          activeOpacity={0.85}
        >
          <Wallet size={18} color={Theme.colors.brand.deep} />
          <View style={styles.ledgerCtaLabelWrap}>
            <Text style={styles.ledgerCtaText}>Open full ledger</Text>
          </View>
          <ChevronRight size={18} color={Theme.colors.brand.deep} />
        </TouchableOpacity>
      </GlassCard>
    );
  }

  return (
    <GlassCard intensity={10} style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Ledger</Text>
        <View style={styles.sectionHeaderLine} />
      </View>
      <Text style={styles.sectionSubcopy}>
        {hasEstimate
          ? "Your next quote or invoice keeps documented spend aligned with your plan."
          : "Upload quotes or invoices here — we pull totals so you can compare to your estimate."}
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
  /** Mirrors `ActivityFeed` header row + line. */
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
  /** Mirrors `ActivityFeed` `eventRow` + icon + text column. */
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
  timeLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
  },
  amountLine: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
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
