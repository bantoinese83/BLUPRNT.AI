import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Shield, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import { GlassCard } from "./ui/GlassCard";

type Props = {
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  invoiceTotal?: number;
};

function calculateHealthScore(invoiceTotal: number, min: number, max: number) {
  if (min === 0 || invoiceTotal === 0) {
    return {
      score: 0,
      status: "Analyzing",
      color: "#94a3b8",
      secondary: "#64748b",
      message: "Processing your initial project data...",
    };
  }

  const progressPct = (invoiceTotal / min) * 100;
  const budgetUtilization = (invoiceTotal / max) * 100;

  if (budgetUtilization > 100) {
    const overPct = budgetUtilization - 100;
    return {
      score: Math.max(0, Math.round(70 - overPct)),
      status: "Over Budget",
      color: "#f43f5e",
      secondary: "#ea580c",
      message: "Careful! You've exceeded your lifecycle estimate.",
    };
  }

  if (budgetUtilization > 85) {
    return {
      score: 75,
      status: "At Limit",
      color: "#fbbf24",
      secondary: "#f59e0b",
      message: "You're approaching the upper limit of your budget.",
    };
  }

  if (progressPct < 20) {
    return {
      score: 95,
      status: "Excellent",
      color: "#34d399",
      secondary: "#14b8a6",
      message: "Starting strong! Your initial spending is well-aligned.",
    };
  }

  return {
    score: 88,
    status: "Healthy",
    color: "#6366f1",
    secondary: "#2563eb",
    message: "Your project spending is pacing well against estimates.",
  };
}

export function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  invoiceTotal = 0,
}: Props) {
  const min = estimatedMin || 0;
  const max = estimatedMax || 0;
  const { score, status, color, secondary, message } = calculateHealthScore(
    invoiceTotal,
    min,
    max,
  );

  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <GlassCard intensity={20} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Index</Text>
        <Shield size={14} color="#64748b" />
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
            {invoiceTotal > 0 && (
              <View style={styles.liveIndicator}>
                <TrendingUp size={10} color="#34d399" />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </View>
        </View>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 800 }}
          style={styles.rightCol}
        >
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={styles.svg}
          >
            <Defs>
              <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} />
                <Stop offset="100%" stopColor={secondary} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 1000 }}
            >
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </MotiView>
          </Svg>
        </MotiView>
      </View>

      <View style={styles.messageBox}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#64748b",
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
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  score: {
    fontSize: 52,
    fontFamily: "Outfit_800ExtraBold",
    letterSpacing: -1.5,
  },
  scoreMax: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "#64748b",
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "white",
    textTransform: "uppercase",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveText: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#34d399",
    textTransform: "uppercase",
  },
  rightCol: {
    width: 100,
    alignItems: "flex-end",
  },
  svg: {
    transform: [{ rotate: "0deg" }],
  },
  messageBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
