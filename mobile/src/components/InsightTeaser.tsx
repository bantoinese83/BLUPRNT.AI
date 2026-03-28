import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Lock, Sparkles, ArrowRight } from "lucide-react-native";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";

interface Props {
  projectName: string;
  onUpgradePress: () => void;
}

export function InsightTeaser({ projectName, onUpgradePress }: Props) {
  return (
    <GlassCard style={styles.container} intensity={25}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Lock size={18} color="#4f46e5" />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Architect Insight</Text>
          <Sparkles size={12} color="#4f46e5" style={{ marginLeft: 4 }} />
        </View>
      </View>

      <Text style={styles.title}>
        Unlock strategic savings for {projectName}
      </Text>

      <View style={styles.blurContainer}>
        <Text style={styles.blurText}>
          Kitchen remodels in this area usually save 12% on materials by
          choosing Grade-B quartz over entry-level granite. Use our regional
          breakdown to...
        </Text>
        <View style={styles.overlay} />
      </View>

      <Button
        title="See AI Insights"
        onPress={onUpgradePress}
        variant="primary"
        icon={<ArrowRight size={18} color="white" />}
        style={{ marginTop: 16 }}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginBottom: 8,
  },
  blurContainer: {
    position: "relative",
  },
  blurText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "rgba(255, 255, 255, 0.4)",
    lineHeight: 20,
    // Note: React Native doesn't have native 'blur' style for text, so we use opacity/overlay
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "transparent", // Custom gradient would be better but let's keep it simple
  },
});
