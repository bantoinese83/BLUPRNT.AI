import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { CONFIDENCE_LABELS } from "@shared/copy/dashboard";

type Props = {
  score: number | null;
  size?: number;
  showText?: boolean;
};

export function ConfidenceDisplay({
  score,
  size = 12,
  showText = true,
}: Props) {
  const n = score != null ? Math.min(5, Math.max(0, Math.round(score))) : 3;
  const percentage = score != null ? Math.round(score * 20) : 60;

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={size}
            fill={i < n ? "#fbbf24" : "transparent"} // amber-400
            color={i < n ? "#fbbf24" : Theme.colors.border}
          />
        ))}
      </View>
      {showText && (
        <Text style={styles.text}>
          {percentage}% {CONFIDENCE_LABELS.confidence}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  text: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
