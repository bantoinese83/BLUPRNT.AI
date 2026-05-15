import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import {
  ShieldCheck,
  PhoneCall,
  Hammer,
  Wrench,
  Banknote,
  Gavel,
  ChevronRight,
  Info,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import { Theme } from "@/constants/Theme";
import { GlassCard } from "@/components/ui/GlassCard";
import * as Haptics from "expo-haptics";

interface ReadinessItemProps {
  icon: LucideIcon;
  title: string;
  status: "ready" | "pending" | "warning";
  description: string;
  index: number;
}

function ReadinessItem({
  icon: Icon,
  title,
  status,
  description,
  index,
}: ReadinessItemProps) {
  const statusColor =
    status === "ready"
      ? Theme.colors.status.success
      : status === "warning"
        ? Theme.colors.status.error
        : Theme.colors.status.warning;

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: 400 + index * 100, type: "timing", duration: 400 }}
      style={styles.itemRow}
    >
      <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
        <Icon size={16} color={statusColor} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{title}</Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <Text style={styles.itemDesc} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </MotiView>
  );
}

interface Props {
  documentCount: number;
  hasQuotes: boolean;
  hasInvoices: boolean;
  onPressAudit?: () => void;
}

export function ProductionReadinessCard({
  documentCount,
  hasQuotes,
  hasInvoices,
  onPressAudit,
}: Props) {
  // Logic to determine "Production Readiness" of the home project
  const readinessItems: Omit<ReadinessItemProps, "index">[] = [
    {
      icon: PhoneCall,
      title: "Maintenance Registry",
      status: hasInvoices ? "ready" : "pending",
      description: hasInvoices
        ? "Primary service team documented"
        : "No contractors on speed dial yet",
    },
    {
      icon: Hammer,
      title: "Usage Durability",
      status: hasQuotes ? "ready" : "warning",
      description: hasQuotes
        ? "Material specs verified for high-traffic"
        : "Incomplete material performance data",
    },
    {
      icon: Wrench,
      title: "Legacy Maintenance",
      status: documentCount > 2 ? "ready" : "pending",
      description:
        documentCount > 2
          ? "Warranties and parts indexed"
          : "Maintenance tech-debt accumulating",
    },
    {
      icon: Banknote,
      title: "Operational Efficiency",
      status: hasInvoices ? "ready" : "pending",
      description: hasInvoices
        ? "Utility ROI tracking active"
        : "Budget leak detection inactive",
    },
    {
      icon: Gavel,
      title: "Liability & Shield",
      status: documentCount > 5 ? "ready" : "warning",
      description:
        documentCount > 5
          ? "Permits and RLS policies verified"
          : "Security & compliance gaps found",
    },
  ];

  const readyCount = readinessItems.filter((i) => i.status === "ready").length;
  const score = Math.round((readyCount / readinessItems.length) * 100);

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>ESTATE AUDIT</Text>
          <Text style={styles.title}>Production Readiness</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{score}%</Text>
        </View>
      </View>

      <View style={styles.list}>
        {readinessItems.map((item, idx) => (
          <ReadinessItem key={item.title} {...item} index={idx} />
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPressAudit?.();
        }}
        style={styles.cta}
      >
        <ShieldCheck size={16} color="white" />
        <Text style={styles.ctaText}>Run Full Readiness Audit</Text>
        <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <View style={styles.footer}>
        <Info size={12} color={Theme.colors.text.muted} />
        <Text style={styles.footerText}>
          Modeled after industry production standards to ensure your home is
          resilient, documented, and investment-grade.
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
  },
  scoreBadge: {
    backgroundColor: Theme.colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreValue: {
    fontSize: 14,
    fontFamily: Theme.typography.family.black,
    color: "white",
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  cta: {
    backgroundColor: Theme.colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 10,
    ...Theme.shadows.brand,
  },
  ctaText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 10,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    lineHeight: 14,
  },
});
