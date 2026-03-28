import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { X, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useAwareness, type SmartInsight } from "../contexts/AwarenessProvider";
import { GlassCard } from "./ui/GlassCard";

const HEALTH_COLORS = {
  optimal: {
    bg: "rgba(16, 185, 129, 0.15)",
    text: "#10b981",
    label: "Optimal",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.15)",
    text: "#f59e0b",
    label: "Watch Closely",
  },
  critical: {
    bg: "rgba(244, 63, 94, 0.15)",
    text: "#f43f5e",
    label: "Needs Attention",
  },
};

function InsightCard({
  insight,
  index,
}: {
  insight: SmartInsight;
  index: number;
}) {
  const iconColor =
    insight.type === "anomaly"
      ? "#f43f5e"
      : insight.type === "opportunity"
        ? "#818cf8"
        : "#f59e0b";

  const bg =
    insight.type === "anomaly"
      ? "rgba(244, 63, 94, 0.08)"
      : insight.type === "opportunity"
        ? "rgba(129, 140, 248, 0.08)"
        : "rgba(245, 158, 11, 0.08)";

  const border =
    insight.type === "anomaly"
      ? "rgba(244, 63, 94, 0.15)"
      : insight.type === "opportunity"
        ? "rgba(129, 140, 248, 0.15)"
        : "rgba(245, 158, 11, 0.15)";

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
          {insight.actionLabel && (
            <Text style={[styles.insightAction, { color: iconColor }]}>
              {insight.actionLabel} →
            </Text>
          )}
        </View>
      </View>
    </MotiView>
  );
}

export function InsightsDrawer() {
  const { insights, projectHealth, isInsightsOpen, setIsInsightsOpen } =
    useAwareness();
  const health = HEALTH_COLORS[projectHealth];

  const handleClose = () => {
    Haptics.selectionAsync();
    setIsInsightsOpen(false);
  };

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
            <X size={20} color="#64748b" />
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
                <Lightbulb size={32} color="#334155" />
              </View>
              <Text style={styles.emptyTitle}>All Looking Good</Text>
              <Text style={styles.emptySubtitle}>
                Your project looks solid. Check back as you add more invoices
                and scope updates.
              </Text>
            </View>
          ) : (
            insights.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75%",
    backgroundColor: "#0d1526",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  healthDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  healthDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
    letterSpacing: -0.3,
  },
  healthLabel: {
    fontSize: 11,
    fontFamily: "Outfit_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
    gap: 12,
    paddingBottom: 8,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    lineHeight: 19,
  },
  insightAction: {
    fontSize: 11,
    fontFamily: "Outfit_700Bold",
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
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#475569",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 260,
  },
  footer: {
    padding: 20,
    paddingTop: 8,
  },
  footerCard: {
    padding: 14,
    borderRadius: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#818cf8",
    lineHeight: 18,
  },
  footerBold: {
    fontFamily: "Outfit_700Bold",
  },
});
