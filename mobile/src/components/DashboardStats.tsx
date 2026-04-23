import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import {
  Wallet,
  FileText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { money } from "@shared/lib/formatters";

type DashboardStatsProps = {
  estimatedMin: number | null;
  estimatedMax: number | null;
  invoiceTotal: number;
  /** All document rows in the project (all types) — not the Free-tier bill cap. */
  documentRowCount: number;
};

interface StatItemProps {
  label: string;
  value: string;
  subValue: string;
  icon: LucideIcon;
  delay?: number;
  badge?: string;
}

function StatItem({
  label,
  value,
  subValue,
  icon: Icon,
  delay = 0,
  badge,
}: StatItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay }}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon size={18} color={Theme.colors.brand.primary} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.valueRow}>
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subValue}>{subValue}</Text>
        </View>
      </GlassCard>
    </MotiView>
  );
}

export function DashboardStats({
  estimatedMin,
  estimatedMax,
  invoiceTotal,
  documentRowCount,
}: DashboardStatsProps) {
  const estimatedMid =
    (estimatedMin ?? 0) + (estimatedMax ?? 0)
      ? ((estimatedMin ?? 0) + (estimatedMax ?? 0)) / 2
      : 0;
  const budgetPct =
    estimatedMid > 0
      ? Math.min(100, Math.round((invoiceTotal / estimatedMid) * 100))
      : 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <StatItem
        label="Estimate"
        value={
          estimatedMin != null && estimatedMax != null
            ? money(estimatedMin, estimatedMax)
            : "—"
        }
        subValue="Total project range"
        icon={Wallet}
      />

      <StatItem
        label="Documents"
        value={documentRowCount.toString()}
        subValue={
          documentRowCount === 1
            ? "file in your ledger"
            : "files in your ledger"
        }
        icon={FileText}
        delay={100}
      />

      <StatItem
        label="Invested"
        value={money(invoiceTotal)}
        subValue="Logged capital spend"
        icon={TrendingUp}
        delay={200}
        badge={
          estimatedMid > 0 && invoiceTotal > 0 ? `${budgetPct}%` : undefined
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -24,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingRight: 40,
    gap: 12,
    paddingVertical: 12,
  },
  cardWrapper: {
    width: 220,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    height: 140,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  content: {
    gap: 2,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  value: {
    fontSize: 20,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    flexShrink: 1,
  },
  subValue: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  badge: {
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
  },
});
