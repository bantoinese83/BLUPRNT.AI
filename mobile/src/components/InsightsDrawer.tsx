import React, { useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { X, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useAwareness, SmartInsight } from "@/contexts/AwarenessContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { showAppToast } from "@/lib/app-toast";

const HEALTH_COLORS = {
  optimal: {
    bg: "rgba(16, 185, 129, 0.12)",
    text: Theme.colors.status.success,
    label: "Optimal",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.12)",
    text: Theme.colors.status.warning,
    label: "Watch Closely",
  },
  critical: {
    bg: "rgba(244, 63, 94, 0.12)",
    text: Theme.colors.status.error,
    label: "Needs Attention",
  },
};

function InsightCard({
  insight,
  index,
  onActionPress,
}: {
  insight: SmartInsight;
  index: number;
  onActionPress: (insight: SmartInsight) => void;
}) {
  const iconColor =
    insight.type === "anomaly"
      ? Theme.colors.status.error
      : insight.type === "opportunity"
        ? Theme.colors.brand.light
        : Theme.colors.status.warning;

  const bg =
    insight.type === "anomaly"
      ? "rgba(244, 63, 94, 0.06)"
      : insight.type === "opportunity"
        ? "rgba(129, 140, 248, 0.06)"
        : "rgba(245, 158, 11, 0.06)";

  const border =
    insight.type === "anomaly"
      ? "rgba(244, 63, 94, 0.12)"
      : insight.type === "opportunity"
        ? "rgba(129, 140, 248, 0.12)"
        : "rgba(245, 158, 11, 0.12)";

  const Icon =
    insight.type === "anomaly"
      ? AlertTriangle
      : insight.type === "opportunity"
        ? TrendingUp
        : Lightbulb;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 80, type: "timing", duration: 300 }}
    >
      <View
        style={[
          styles.insightCard,
          { backgroundColor: bg, borderColor: border },
        ]}
      >
        <View
          style={[styles.insightIcon, { backgroundColor: `${iconColor}20` }]}
        >
          <Icon size={18} color={iconColor} />
        </View>
        <View style={styles.insightBody}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightDesc}>{insight.description}</Text>
          {insight.actionLabel && insight.actionKind ? (
            <TouchableOpacity
              onPress={() => onActionPress(insight)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={insight.actionLabel}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[styles.insightAction, { color: iconColor }]}>
                {insight.actionLabel} →
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </MotiView>
  );
}

export function InsightsDrawer() {
  const {
    insights,
    projectHealth,
    isInsightsOpen,
    setIsInsightsOpen,
    activeProjectId,
  } = useAwareness();
  const health = HEALTH_COLORS[projectHealth];

  const handleClose = () => {
    Haptics.selectionAsync();
    setIsInsightsOpen(false);
  };

  const handleInsightAction = useCallback(
    (insight: SmartInsight) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsInsightsOpen(false);
      const { actionKind } = insight;
      if (!actionKind) return;

      if (actionKind === "scope") {
        if (activeProjectId) router.push(`/project/${activeProjectId}`);
        else
          showAppToast("Select a project on Home, then open insights again.");
        return;
      }
      if (actionKind === "execute") {
        router.push("/(tabs)");
        showAppToast("Tap + to upload an invoice or document.");
        return;
      }
      if (actionKind === "record") {
        if (activeProjectId) router.push(`/project/${activeProjectId}`);
        else showAppToast("Open your project to export or share.");
      }
    },
    [activeProjectId, setIsInsightsOpen],
  );

  return (
    <Modal
      visible={isInsightsOpen}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.healthDot, { backgroundColor: health.bg }]}>
              <View
                style={[
                  styles.healthDotInner,
                  { backgroundColor: health.text },
                ]}
              />
            </View>
            <View>
              <Text style={styles.title}>Smart Insights</Text>
              <Text style={[styles.healthLabel, { color: health.text }]}>
                {health.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <X size={20} color={Theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {insights.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Lightbulb size={32} color={Theme.colors.text.secondary} />
              </View>
              <Text style={styles.emptyTitle}>All Looking Good</Text>
              <Text style={styles.emptySubtitle}>
                Your project looks solid. Check back as you add more invoices
                and scope updates.
              </Text>
            </View>
          ) : (
            insights.map((insight, i) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                index={i}
                onActionPress={handleInsightAction}
              />
            ))
          )}
        </ScrollView>

        {/* Footer tip */}
        <View style={styles.footer}>
          <GlassCard intensity={8} style={styles.footerCard}>
            <Text style={styles.footerText}>
              <Text style={styles.footerBold}>Pro Tip: </Text>
              Keeping your invoices and scope updated ensures these insights
              stay accurate and actionable.
            </Text>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75%",
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.radius.sm,
    alignSelf: "center",
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  healthDot: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  healthDotInner: {
    width: 10,
    height: 10,
    borderRadius: Theme.radius.full,
  },
  title: {
    fontSize: Theme.typography.size.xl,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  healthLabel: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 1,
  },
  closeBtn: {
    // Accessible touch target (44x44)
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Theme.spacing.xl,
    gap: 12,
    paddingBottom: 8,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 19,
  },
  insightAction: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.xl,
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: Theme.typography.size.xl,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  emptySubtitle: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 260,
  },
  footer: {
    padding: Theme.spacing.lg,
    paddingTop: 8,
  },
  footerCard: {
    padding: 14,
    borderRadius: Theme.radius.lg,
  },
  footerText: {
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.brand.light,
    lineHeight: 18,
  },
  footerBold: {
    fontFamily: Theme.typography.family.bold,
  },
});
