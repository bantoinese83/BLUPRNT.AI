import React, { useId, memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Shield, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { calculateHealthScore } from "@shared/lib/project-health";

type Props = {
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  spendingTotal?: number;
};

export const ProjectHealth = memo(function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  spendingTotal = 0,
}: Props) {
  const min = estimatedMin || 0;
  const max = estimatedMax || 0;
  const { score, status, message } = calculateHealthScore(
    spendingTotal,
    min,
    max,
  );

  const colorMap: Record<string, { color: string; secondary: string }> = {
    Analyzing: {
      color: Theme.colors.text.secondary,
      secondary: Theme.colors.text.muted,
    },
    "Over Budget": { color: Theme.colors.status.error, secondary: "#ea580c" },
    "At Limit": {
      color: Theme.colors.status.warning,
      secondary: Theme.colors.status.warning,
    },
    Excellent: { color: Theme.colors.status.success, secondary: "#14b8a6" },
    Healthy: {
      color: Theme.colors.brand.primary,
      secondary: Theme.colors.brand.deep,
    },
  };
  const activeColors = colorMap[status] ?? colorMap["Healthy"]!;
  const { color, secondary } = activeColors;

  const CIRCLE_CONFIG = {
    SIZE: 100,
    STROKE_WIDTH: 10,
    ANIMATION_DURATION: 800,
  } as const;

  const radius = (CIRCLE_CONFIG.SIZE - CIRCLE_CONFIG.STROKE_WIDTH) / 2;
  const circumference = radius * 2 * Math.PI;
  /** Portion of the ring hidden by dash offset so `score/100` of the stroke shows (clockwise from top). */
  const ringDashOffset = circumference * (1 - score / 100);
  const gradId = `healthRing-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Index</Text>
        <Shield size={14} color={Theme.colors.text.secondary} />
      </View>

      <View style={styles.content}>
        <View style={styles.leftCol}>
          <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            style={styles.scoreRow}
          >
            <Text style={[styles.score, { color }]}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </MotiView>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: color }]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
            {spendingTotal > 0 && (
              <View style={styles.liveIndicator}>
                <TrendingUp size={10} color={Theme.colors.status.success} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </View>
        </View>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "timing",
            duration: CIRCLE_CONFIG.ANIMATION_DURATION,
          }}
          style={styles.rightCol}
        >
          <Svg
            width={CIRCLE_CONFIG.SIZE}
            height={CIRCLE_CONFIG.SIZE}
            viewBox={`0 0 ${CIRCLE_CONFIG.SIZE} ${CIRCLE_CONFIG.SIZE}`}
            style={styles.svg}
          >
            <Defs>
              <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} />
                <Stop offset="100%" stopColor={secondary} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={CIRCLE_CONFIG.SIZE / 2}
              cy={CIRCLE_CONFIG.SIZE / 2}
              r={radius}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth={CIRCLE_CONFIG.STROKE_WIDTH}
              fill="none"
            />
            {/* Must stay Svg primitives — wrapping with MotiView breaks the ring on device. */}
            <Circle
              cx={CIRCLE_CONFIG.SIZE / 2}
              cy={CIRCLE_CONFIG.SIZE / 2}
              r={radius}
              stroke={`url(#${gradId})`}
              strokeWidth={CIRCLE_CONFIG.STROKE_WIDTH}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={ringDashOffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CIRCLE_CONFIG.SIZE / 2} ${CIRCLE_CONFIG.SIZE / 2})`}
            />
          </Svg>
        </MotiView>
      </View>

      <View style={styles.messageBox}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Theme.spacing.xs,
  },
  score: {
    fontSize: 56,
    fontFamily: Theme.typography.family.black,
    letterSpacing: -1.5,
  },
  scoreMax: {
    fontSize: Theme.typography.size.xl,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radius.sm,
  },
  statusText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
    textTransform: "uppercase",
  },
  rightCol: {
    width: 100,
    flexShrink: 0,
    alignItems: "flex-end",
  },
  svg: {
    transform: [{ rotate: "0deg" }],
  },
  messageBox: {
    marginTop: Theme.spacing.xl,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: Theme.radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
});
