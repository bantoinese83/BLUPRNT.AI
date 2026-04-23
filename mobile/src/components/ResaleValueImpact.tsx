import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { TrendingUp, Info } from "lucide-react-native";
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

interface Props {
  investment: number;
  projectName: string;
}

export function ResaleValueImpact({ investment, projectName }: Props) {
  const valueAddScale = 1.25; // Professional estimate: 1.25x ROI on quality renovations
  const estimatedValueAdd = investment * valueAddScale;
  const ledgerPremium = investment > 0 ? investment * 0.05 : 0; // 5% bonus for professional documentation
  const totalImpact = estimatedValueAdd + ledgerPremium;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TrendingUp size={16} color={Theme.colors.brand.primary} />
            <Text style={styles.title}>RESALE VALUE IMPACT</Text>
          </View>
          {investment > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LEDGER PREMIUM ACTIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.impactRow}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={totalImpact}
          >
            <Text style={styles.impactValue}>
              {formatCurrency(totalImpact)}
            </Text>
          </MotiView>
          <Text style={styles.impactLabel}>Est. Added Value</Text>
        </View>

        {ledgerPremium > 0 && (
          <View style={styles.premiumBox}>
            <View>
              <Text style={styles.premiumTitle}>LEDGER PREMIUM</Text>
              <Text style={styles.premiumSubtitle}>
                Earned through documentation
              </Text>
            </View>
            <Text style={styles.premiumValue}>
              +{formatCurrency(ledgerPremium)}
            </Text>
          </View>
        )}

        {/* ROI Visualization — badge below chart so it never covers the line/dot */}
        <View style={styles.chartContainer}>
          <Svg width="100%" height="56" viewBox="0 0 300 56">
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="300" y2="0">
                <Stop offset="0" stopColor="transparent" />
                <Stop offset="100" stopColor="#0d9488" />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 50 Q 75 45, 150 30 T 300 10"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Circle cx="300" cy="10" r="5" fill="#0d9488" />
          </Svg>
          <View style={styles.peakBadgeRow}>
            <View style={styles.peakBadge}>
              <Text style={styles.peakText}>PEAK ROI</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Info size={14} color="#64748b" />
          <Text style={styles.infoText}>
            Illustrative example only—not an appraisal or guarantee. Based on
            rough inputs for <Text style={styles.bold}>{projectName}</Text>.
            Clear documentation can help others understand your improvements;
            actual value depends on many factors.
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inner: {
    padding: 20,
    paddingTop: 24, // Extra top breathing room
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.status.success,
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 20,
  },
  impactValue: {
    fontSize: 40,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
  },
  impactLabel: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
  premiumBox: {
    backgroundColor: "rgba(13, 148, 136, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    letterSpacing: 1,
  },
  premiumSubtitle: {
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  premiumValue: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
  chartContainer: {
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  peakBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    paddingRight: 2,
  },
  peakBadge: {
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    ...Theme.shadows.brand,
  },
  peakText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: "white",
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.onSoft,
    lineHeight: 18,
  },
  bold: {
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
});
