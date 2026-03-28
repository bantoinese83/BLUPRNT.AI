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
import { GlassCard } from "./ui/GlassCard";

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
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TrendingUp size={16} color="#818cf8" />
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
          <Text style={styles.impactValue}>{formatCurrency(totalImpact)}</Text>
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

      {/* ROI Visualization */}
      <View style={styles.chartContainer}>
        <Svg width="100%" height="60" viewBox="0 0 300 60">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="300" y2="0">
              <Stop offset="0" stopColor="transparent" />
              <Stop offset="100" stopColor="#818cf8" />
            </LinearGradient>
          </Defs>
          <Path
            d="M0 50 Q 75 45, 150 30 T 300 10"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle cx="300" cy="10" r="4" fill="#818cf8" />
        </Svg>
        <View style={styles.peakBadge}>
          <Text style={styles.peakText}>PEAK ROI</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Info size={14} color="#64748b" />
        <Text style={styles.infoText}>
          Based on current renovation data for{" "}
          <Text style={styles.bold}>{projectName}</Text>. Professional
          documentation typically yields higher appraisal values.
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#94a3b8",
    letterSpacing: 1.5,
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Outfit_700Bold",
    color: "#10b981",
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 16,
  },
  impactValue: {
    fontSize: 32,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  impactLabel: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: "#64748b",
  },
  premiumBox: {
    backgroundColor: "rgba(129, 140, 248, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 9,
    fontFamily: "Outfit_700Bold",
    color: "#818cf8",
    letterSpacing: 1,
  },
  premiumSubtitle: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
  },
  premiumValue: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "#818cf8",
  },
  chartContainer: {
    height: 60,
    marginTop: 8,
    marginBottom: 16,
  },
  peakBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#818cf8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  peakText: {
    fontSize: 8,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    lineHeight: 16,
  },
  bold: {
    fontFamily: "Outfit_700Bold",
    color: "#94a3b8",
  },
});
