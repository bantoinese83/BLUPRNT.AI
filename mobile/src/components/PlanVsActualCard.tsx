import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Scale, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { GlassCard } from "./ui/GlassCard";
import { Theme } from "../constants/Theme";
import { money } from "../lib/formatters";
import {
  capitalImprovementTotal,
  planVsActualNarrative,
  type InvoiceLike,
} from "../lib/plan-vs-actual";

type Props = {
  estimatedMin: number | null;
  estimatedMax: number | null;
  invoices: InvoiceLike[];
  projectId: string;
};

const toneForKind: Record<
  string,
  { border: string; headline: string; iconBg: string }
> = {
  no_estimate: {
    border: "rgba(148, 163, 184, 0.35)",
    headline: Theme.colors.text.primary,
    iconBg: "rgba(148, 163, 184, 0.2)",
  },
  no_documents: {
    border: "rgba(99, 102, 241, 0.45)",
    headline: "#a5b4fc",
    iconBg: "rgba(99, 102, 241, 0.25)",
  },
  within: {
    border: "rgba(52, 211, 153, 0.45)",
    headline: "#6ee7b7",
    iconBg: "rgba(16, 185, 129, 0.2)",
  },
  below_min: {
    border: "rgba(56, 189, 248, 0.45)",
    headline: "#7dd3fc",
    iconBg: "rgba(14, 165, 233, 0.2)",
  },
  above_max: {
    border: "rgba(251, 191, 36, 0.5)",
    headline: "#fcd34d",
    iconBg: "rgba(245, 158, 11, 0.2)",
  },
};

export function PlanVsActualCard({
  estimatedMin,
  estimatedMax,
  invoices,
  projectId,
}: Props) {
  const capital = capitalImprovementTotal(invoices);
  const { headline, body, kind } = planVsActualNarrative(
    estimatedMin,
    estimatedMax,
    capital,
  );
  const tone = toneForKind[kind] ?? toneForKind.no_estimate;

  return (
    <GlassCard
      style={[styles.card, { borderColor: tone.border, borderWidth: 1.5 }]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
          <Scale size={22} color="white" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.kicker}>Plan vs documented spend</Text>
          <Text style={[styles.headline, { color: tone.headline }]}>
            {headline}
          </Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Your estimate</Text>
          <Text style={styles.statValue}>
            {money(estimatedMin, estimatedMax)}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Invoices & quotes</Text>
          <Text style={styles.statValue}>{money(capital)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={() => {
          Haptics.selectionAsync();
          router.push("/(tabs)/finance");
        }}
        accessibilityRole="button"
        accessibilityLabel="Open finance tab to export seller packet"
      >
        <Text style={styles.ctaText}>Seller packet includes this story</Text>
        <ChevronRight size={18} color={Theme.colors.brand.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/project/${projectId}`);
        }}
        accessibilityRole="button"
        accessibilityLabel="Open project detail"
      >
        <Text style={styles.link}>Project detail</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 17,
    fontFamily: Theme.typography.family.black,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: 6,
    fontSize: 17,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
  link: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.muted,
    textAlign: "center",
    paddingBottom: 4,
  },
});
