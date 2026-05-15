import React, { useId, memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  Shield,
  TrendingUp,
  FileText,
  Layers,
  Receipt,
  Percent,
  Activity,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { calculateHealthScore } from "@shared/lib/project-health";
import { money } from "@shared/lib/formatters";

type Props = {
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  spendingTotal?: number;
  documentCount?: number;
  scopeLineCount?: number;
  unreconciledBilled?: number;
};

function MetricChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <View style={metricStyles.chip}>
      <Icon size={12} color={Theme.colors.brand.primary} />
      <Text style={metricStyles.chipLabel}>{label}</Text>
      <Text
        style={metricStyles.chipValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
    </View>
  );
}

export const ProjectHealth = memo(function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  spendingTotal = 0,
  documentCount = 0,
  scopeLineCount = 0,
  unreconciledBilled = 0,
}: Props) {
  const min = estimatedMin || 0;
  const max = estimatedMax || 0;
  const { score, status, message, pctOfEstimateHigh, dollarsOverHighEstimate } =
    calculateHealthScore(spendingTotal, min, max);

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
  const ringDashOffset = circumference * (1 - score / 100);
  const gradId = `healthRing-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const runway = useMemo(() => {
    if (min <= 0 || max <= 0) return null;
    const scale = Math.max(min, max, spendingTotal) * 1.08 || 1;
    const loPct = Math.min(100, (min / scale) * 100);
    const hiPct = Math.min(100, (max / scale) * 100);
    const spendPctRaw = (spendingTotal / scale) * 100;
    const spendPct = Math.min(100, Math.max(0, spendPctRaw));
    const bandLeft = Math.min(loPct, hiPct);
    const bandWidth = Math.max(hiPct - loPct, 0.8);
    return { bandLeft, bandWidth, spendPct, overHigh: spendingTotal > max };
  }, [min, max, spendingTotal]);

  const pctHighRounded = Math.round(pctOfEstimateHigh);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Index</Text>
        <View style={styles.headerIconWrap} accessibilityLabel="Health shield">
          <Shield size={15} color={Theme.colors.text.secondary} />
        </View>
      </View>

      <View style={styles.topRow}>
        <View style={styles.scoreBlock}>
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
          style={styles.ringWrap}
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

      <View style={styles.metricsBlock}>
        <View
          style={[
            styles.metricsRow,
            unreconciledBilled > 0 && styles.metricsRowFour,
          ]}
        >
          <MetricChip
            icon={FileText}
            label="Docs"
            value={documentCount > 0 ? String(documentCount) : "—"}
          />
          <MetricChip
            icon={Layers}
            label="Scope"
            value={scopeLineCount > 0 ? String(scopeLineCount) : "—"}
          />
          <MetricChip
            icon={Percent}
            label="Vs high"
            value={max > 0 && spendingTotal > 0 ? `${pctHighRounded}%` : "—"}
          />
          {unreconciledBilled > 0 ? (
            <MetricChip
              icon={Receipt}
              label="Unlinked"
              value={money(unreconciledBilled)}
            />
          ) : null}
        </View>
      </View>

      {runway && spendingTotal > 0 ? (
        <View style={styles.runwayWrap}>
          <View style={styles.runwayHeader}>
            <Text style={styles.runwayCaption}>
              Spend on your estimate range
            </Text>
          </View>

          <View style={styles.runwayStack}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.spendBadgeAnchor,
                  { left: `${runway.spendPct}%` },
                ]}
              >
                <MotiView
                  from={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", delay: 400, damping: 18 }}
                  style={[
                    styles.spendBadge,
                    runway.overHigh && styles.spendBadgeOver,
                  ]}
                >
                  <Text
                    style={styles.spendBadgeValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {money(spendingTotal)}
                  </Text>
                  <View
                    style={[
                      styles.spendBadgeArrow,
                      {
                        borderTopColor: runway.overHigh
                          ? Theme.colors.status.error
                          : Theme.colors.brand.primary,
                      },
                    ]}
                  />
                </MotiView>
              </View>
            </View>

            <View style={styles.runwayTrack}>
              <View
                style={[
                  styles.runwaySpendFill,
                  {
                    width: `${runway.spendPct}%`,
                    backgroundColor: runway.overHigh
                      ? "rgba(220, 38, 38, 0.35)"
                      : "rgba(13, 148, 136, 0.35)",
                  },
                ]}
              />
              <View
                style={[
                  styles.runwayBand,
                  {
                    left: `${runway.bandLeft}%`,
                    width: `${runway.bandWidth}%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.runwayDotRing,
                  {
                    left: `${runway.spendPct}%`,
                    marginLeft: -12,
                  },
                ]}
              >
                <View
                  style={[
                    styles.runwayDotInner,
                    {
                      backgroundColor: runway.overHigh
                        ? Theme.colors.status.error
                        : Theme.colors.brand.primary,
                    },
                  ]}
                />
              </View>
              {runway.overHigh ? (
                <Text style={styles.runwayOverLabel}>Over</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.runwayLabels}>
            <Text style={styles.runwayLabelText} numberOfLines={1}>
              Low {money(min)}
            </Text>
            <Text style={styles.runwayLabelTextRight} numberOfLines={1}>
              High {money(max)}
            </Text>
          </View>
        </View>
      ) : runway && status === "Analyzing" ? (
        <Text style={styles.runwayHint}>
          Upload documents to compare spend with your estimate range.
        </Text>
      ) : null}

      {dollarsOverHighEstimate > 0 ? (
        <Text style={styles.overCopy}>
          {money(dollarsOverHighEstimate)} above high estimate
        </Text>
      ) : null}

      <View style={styles.messageBox}>
        <Activity size={14} color={Theme.colors.text.muted} />
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </GlassCard>
  );
});

const metricStyles = StyleSheet.create({
  chip: {
    flex: 1,
    minWidth: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  chipLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipValue: {
    fontSize: 13,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
  },
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
    paddingTop: 4,
    marginBottom: Theme.spacing.md + 2,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  headerTitle: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: Theme.spacing.md,
  },
  scoreBlock: {
    flex: 1,
    minWidth: 0,
  },
  ringWrap: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  metricsBlock: {
    width: "100%",
    marginTop: 4,
    marginBottom: Theme.spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricsRowFour: {
    flexWrap: "wrap",
    rowGap: 8,
  },
  runwayWrap: {
    gap: 10,
    marginTop: 4,
    marginBottom: Theme.spacing.md,
  },
  runwayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runwayCaption: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    lineHeight: 14,
  },
  runwayStack: {
    width: "100%",
    gap: 10,
  },
  badgeRow: {
    position: "relative",
    width: "100%",
    minHeight: 44,
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  spendBadgeAnchor: {
    position: "absolute",
    bottom: 0,
    width: 0,
    alignItems: "center",
    zIndex: 20,
  },
  spendBadge: {
    backgroundColor: Theme.colors.brand.primary,
    position: "relative",
    paddingHorizontal: 12,
    paddingVertical: 7,
    paddingBottom: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "72%",
    minWidth: 72,
    ...Theme.shadows.brand,
  },
  spendBadgeOver: {
    backgroundColor: Theme.colors.status.error,
  },
  spendBadgeArrow: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  spendBadgeValue: {
    fontSize: 13,
    fontFamily: Theme.typography.family.black,
    color: "white",
    textAlign: "center",
    width: "100%",
  },
  runwayTrack: {
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  runwaySpendFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    zIndex: 0,
  },
  runwayOverLabel: {
    position: "absolute",
    right: 6,
    top: "50%",
    marginTop: -6,
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.status.error,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    zIndex: 4,
  },
  runwayBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(13, 148, 136, 0.18)",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(13, 148, 136, 0.55)",
    zIndex: 2,
  },
  runwayDotRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    top: "50%",
    marginTop: -12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  runwayDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  runwayLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runwayLabelText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.muted,
  },
  runwayLabelTextRight: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.muted,
    textAlign: "right",
  },
  runwayHint: {
    fontSize: 12,
    color: Theme.colors.text.muted,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: Theme.spacing.sm,
  },
  overCopy: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.status.error,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Theme.spacing.xs,
  },
  score: {
    fontSize: 48,
    fontFamily: Theme.typography.family.black,
    letterSpacing: -1.5,
  },
  scoreMax: {
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
  svg: {
    transform: [{ rotate: "0deg" }],
  },
  messageBox: {
    marginTop: Theme.spacing.lg,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: Theme.radius.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
    paddingTop: 1,
  },
});
