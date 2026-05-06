import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  CalendarClock,
  Shield,
  FileWarning,
  BadgeCheck,
} from "lucide-react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import type { LedgerEntryRow } from "@shared/types/database";
import {
  collectUpcomingRenewals,
  renewalRelativeLabel,
  summarizeRenewals,
  type RenewalKind,
  type UpcomingRenewal,
} from "@shared/lib/upcoming-renewals";
import { UPCOMING_RENEWALS_COPY } from "@shared/copy/dashboard";
import { formatShortUsDate } from "@shared/lib/formatters";

const KIND_ICON: Record<RenewalKind, typeof Shield> = {
  warranty: BadgeCheck,
  insurance: Shield,
  permit: FileWarning,
};

function urgencyStyle(urgency: UpcomingRenewal["urgency"]) {
  switch (urgency) {
    case "expired":
      return {
        pillBg: "rgba(244,63,94,0.12)",
        pillFg: Theme.colors.status.error,
        label: "Expired",
      };
    case "soon":
      return {
        pillBg: "rgba(251,191,36,0.18)",
        pillFg: "#b45309",
        label: "≤ 30d",
      };
    case "upcoming":
      return {
        pillBg: "rgba(20,184,166,0.12)",
        pillFg: Theme.colors.brand.primary,
        label: "≤ 90d",
      };
    default:
      return {
        pillBg: Theme.colors.inputBg,
        pillFg: Theme.colors.text.secondary,
        label: "Tracked",
      };
  }
}

export type UpcomingRenewalsSectionProps = {
  ledgerEntries: readonly LedgerEntryRow[];
  onOpenLedgerEntry: (entry: LedgerEntryRow) => void;
  limit?: number;
};

export function UpcomingRenewalsSection({
  ledgerEntries,
  onOpenLedgerEntry,
  limit = 5,
}: UpcomingRenewalsSectionProps) {
  const allItems = useMemo(
    () => collectUpcomingRenewals(ledgerEntries, { maxDaysAhead: 365 * 5 }),
    [ledgerEntries],
  );
  const summary = useMemo(() => summarizeRenewals(allItems), [allItems]);
  const visible = useMemo(() => allItems.slice(0, limit), [allItems, limit]);
  const hiddenCount = Math.max(0, allItems.length - visible.length);

  if (allItems.length === 0) return null;

  const badgeText =
    summary.expired > 0
      ? `${summary.expired} expired`
      : summary.soon > 0
        ? `${summary.soon} due soon`
        : null;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <CalendarClock size={16} color={Theme.colors.text.secondary} />
            <Text style={styles.title}>{UPCOMING_RENEWALS_COPY.title}</Text>
          </View>
          <Text style={styles.subtitle}>{UPCOMING_RENEWALS_COPY.subtitle}</Text>
        </View>
        {badgeText ? (
          <View
            style={[
              styles.badge,
              summary.expired > 0 ? styles.badgeExpired : styles.badgeSoon,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                summary.expired > 0
                  ? styles.badgeTextExpired
                  : styles.badgeTextSoon,
              ]}
            >
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.list}>
        {visible.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const u = urgencyStyle(item.urgency);
          const entry = ledgerEntries.find((e) => e.id === item.ledgerEntryId);
          return (
            <TouchableOpacity
              key={`${item.ledgerEntryId}-${item.kind}`}
              style={styles.row}
              onPress={() => {
                if (entry) onOpenLedgerEntry(entry);
              }}
              disabled={!entry}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.label} for ${
                item.vendorName || "record"
              }`}
            >
              <View style={[styles.iconWrap, { backgroundColor: u.pillBg }]}>
                <Icon size={16} color={u.pillFg} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.vendor} numberOfLines={1}>
                    {item.vendorName?.trim() || `${item.label} record`}
                  </Text>
                  <Text style={styles.kind}>{item.label}</Text>
                </View>
                <Text style={styles.dateLine}>
                  {formatShortUsDate(item.dueDate)}
                  <Text style={[styles.relative, { color: u.pillFg }]}>
                    {" · "}
                    {renewalRelativeLabel(item.daysUntil)}
                  </Text>
                </Text>
              </View>
              <Text style={[styles.pill, { color: u.pillFg }]}>{u.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {hiddenCount > 0 ? (
        <Text style={styles.moreHint}>
          +{hiddenCount} more tracked further out
        </Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeExpired: { backgroundColor: "rgba(244,63,94,0.12)" },
  badgeSoon: { backgroundColor: "rgba(251,191,36,0.18)" },
  badgeText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 0.6,
  },
  badgeTextExpired: { color: Theme.colors.status.error },
  badgeTextSoon: { color: "#b45309" },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.colors.divider,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.divider,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vendor: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  kind: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 0.8,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
  },
  dateLine: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  relative: { fontWeight: "600" },
  pill: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  moreHint: {
    marginTop: 10,
    fontSize: 11,
    color: Theme.colors.text.muted,
    fontFamily: Theme.typography.family.medium,
  },
});
