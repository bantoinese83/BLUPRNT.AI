import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import {
  TrendingUp,
  Info,
  ShieldCheck,
  Crown,
  Trophy,
  Activity,
  Database,
} from "lucide-react-native";
import { MotiView } from "moti";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { calculateResaleImpact } from "@shared/lib/resale-value";

interface Props {
  investment: number;
  projectName: string;
}

export function ResaleValueImpact({ investment, projectName }: Props) {
  const { ledgerPremium, totalImpact } = useMemo(
    () => calculateResaleImpact(investment),
    [investment],
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const roiMultiplier =
    investment > 0 ? (totalImpact / investment).toFixed(2) : "1.25";

  return (
    <GlassCard style={styles.container}>
      <View style={styles.inner}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MotiView
              from={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "timing",
                duration: 1500,
                loop: true,
                repeatReverse: true,
              }}
            >
              <TrendingUp size={16} color={Theme.colors.brand.primary} />
            </MotiView>
            <Text style={styles.title}>RESALE VALUE IMPACT</Text>
          </View>
          {investment > 0 && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", damping: 18 }}
              style={styles.badge}
            >
              <ShieldCheck
                size={10}
                color="#10b981"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.badgeText}>LEDGER PREMIUM ACTIVE</Text>
            </MotiView>
          )}
        </View>

        {/* Main Value Display */}
        <View style={styles.impactMain}>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 100 }}
          >
            <Text style={styles.impactValue}>
              {formatCurrency(totalImpact)}
            </Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 300 }}
          >
            <Text style={styles.impactLabel}>Est. Total Added Value</Text>
          </MotiView>
        </View>

        {/* Investment Comparison Bar */}
        {investment > 0 && (
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonLabel}>Investment vs Impact</Text>
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>{roiMultiplier}x ROI</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <MotiView
                from={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 15, delay: 400 }}
                style={[styles.barValue, { width: "100%" }]}
              >
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: investment / totalImpact,
                      backgroundColor: Theme.colors.text.muted,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: (totalImpact - investment) / totalImpact,
                      backgroundColor: Theme.colors.brand.primary,
                    },
                  ]}
                />
              </MotiView>
            </View>
            <View style={styles.barLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Theme.colors.text.muted },
                  ]}
                />
                <Text style={styles.legendText}>
                  Cost ({formatCurrency(investment)})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Theme.colors.brand.primary },
                  ]}
                />
                <Text style={styles.legendText}>
                  Net Gain ({formatCurrency(totalImpact - investment)})
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Premium Breakdown */}
        {ledgerPremium > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 500 }}
            style={styles.premiumBox}
          >
            <View style={styles.premiumTextContainer}>
              <View style={styles.premiumIconCircle}>
                <Crown size={14} color={Theme.colors.brand.primary} />
              </View>
              <View>
                <Text style={styles.premiumTitle}>LEDGER PREMIUM</Text>
                <Text style={styles.premiumSubtitle}>
                  Verification bonus earned
                </Text>
              </View>
            </View>
            <Text style={styles.premiumValue}>
              +{formatCurrency(ledgerPremium)}
            </Text>
          </MotiView>
        )}

        {/* Dynamic Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Project Lifecycle ROI</Text>
          <View style={styles.chartWrapper}>
            <Svg
              width="100%"
              height="80"
              viewBox="0 0 300 80"
              style={{ overflow: "visible" }}
            >
              <Defs>
                <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={Theme.colors.brand.primary}
                    stopOpacity="0.15"
                  />
                  <Stop
                    offset="1"
                    stopColor={Theme.colors.brand.primary}
                    stopOpacity="0"
                  />
                </LinearGradient>
                <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop
                    offset="0"
                    stopColor={Theme.colors.brand.primary}
                    stopOpacity="0.4"
                  />
                  <Stop offset="1" stopColor={Theme.colors.brand.primary} />
                </LinearGradient>
              </Defs>

              {/* Area Fill */}
              <Path
                d="M0 70 Q 70 65, 140 40 T 280 15 L 280 80 L 0 80 Z"
                fill="url(#fillGrad)"
              />

              {/* Line */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 600 }}
              >
                <Path
                  d="M0 70 Q 70 65, 140 40 T 280 15"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </MotiView>

              {/* Animated Dot */}
              <Circle
                cx="280"
                cy="15"
                r="5"
                fill={Theme.colors.brand.primary}
              />
              <Circle
                cx="280"
                cy="15"
                r="10"
                fill={Theme.colors.brand.primary}
                opacity="0.2"
              />
            </Svg>

            <View style={styles.chartAxes}>
              <Text style={styles.axisLabel}>Start</Text>
              <Text style={styles.axisLabel}>Completed</Text>
            </View>

            <View style={styles.peakContainer}>
              <View style={styles.peakBadge}>
                <Trophy size={10} color="white" style={{ marginRight: 4 }} />
                <Text style={styles.peakText}>MAX VALUE REACHED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Value Drivers */}
        <View style={styles.driversContainer}>
          <View style={styles.driverItem}>
            <View style={styles.driverIcon}>
              <Activity size={12} color={Theme.colors.brand.primary} />
            </View>
            <Text style={styles.driverText}>Market Demand</Text>
          </View>
          <View style={styles.driverItem}>
            <View style={styles.driverIcon}>
              <ShieldCheck size={12} color={Theme.colors.brand.primary} />
            </View>
            <Text style={styles.driverText}>Quality Cert</Text>
          </View>
          <View style={styles.driverItem}>
            <View style={styles.driverIcon}>
              <Database size={12} color={Theme.colors.brand.primary} />
            </View>
            <Text style={styles.driverText}>Data Integrity</Text>
          </View>
        </View>

        {/* Info Disclaimer */}
        <View style={styles.infoBox}>
          <Info size={14} color={Theme.colors.text.muted} />
          <Text style={styles.infoText}>
            Estimates based on national averages for{" "}
            <Text style={styles.bold}>{projectName}</Text>. Professional
            documentation via BLUPRNT can increase buyer confidence by verifying
            scope and material quality.
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 24,
  },
  inner: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1, // Allow title to take remaining space
    marginRight: 8,
  },
  title: {
    fontSize: 9, // Slightly smaller to fit
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    letterSpacing: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    backgroundColor: "rgba(6, 78, 59, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: "#34d399", // Emerald 400
    letterSpacing: 0.5,
  },
  impactMain: {
    alignItems: "center",
    marginBottom: 24,
  },
  impactValue: {
    fontSize: 48,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1.5,
  },
  impactLabel: {
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    marginTop: -4,
  },
  comparisonContainer: {
    marginBottom: 24,
  },
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  comparisonLabel: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  multiplierBadge: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  multiplierText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
  },
  barTrack: {
    height: 10,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    borderRadius: 5,
    overflow: "hidden",
  },
  barValue: {
    flexDirection: "row",
    height: "100%",
  },
  barSegment: {
    height: "100%",
  },
  barLegend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  premiumBox: {
    backgroundColor: "rgba(13, 148, 136, 0.06)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.15)",
    marginBottom: 24,
  },
  premiumTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.soft,
  },
  premiumTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    letterSpacing: 0.5,
  },
  premiumSubtitle: {
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  premiumValue: {
    fontSize: 18,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 12,
  },
  chartWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    padding: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  chartAxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12, // More space from chart
    paddingHorizontal: 8,
  },
  axisLabel: {
    fontSize: 10, // Larger
    fontFamily: Theme.typography.family.black, // Bolder
    color: Theme.colors.text.secondary, // Better contrast
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  peakContainer: {
    position: "absolute",
    top: -12, // Float it slightly above the chart curve
    right: 8,
  },
  peakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    ...Theme.shadows.brand,
  },
  peakText: {
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: "white",
  },
  driversContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  driverItem: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    ...Theme.shadows.soft,
  },
  driverIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  driverText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    padding: 16,
    borderRadius: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.onSoft,
    lineHeight: 16,
  },
  bold: {
    fontFamily: Theme.typography.family.bold,
  },
});
