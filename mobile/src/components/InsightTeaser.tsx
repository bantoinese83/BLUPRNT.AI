import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Lock, Sparkles, ArrowRight } from "lucide-react-native";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { Theme } from "../constants/Theme";

interface Props {
  projectName: string;
  onUpgradePress: () => void;
}

export function InsightTeaser({ projectName, onUpgradePress }: Props) {
  return (
    <GlassCard style={styles.container} intensity={25}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Lock size={18} color={Theme.colors.brand.primary} />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Architect Insight</Text>
          <Sparkles
            size={12}
            color={Theme.colors.brand.primary}
            style={{ marginLeft: 4 }}
          />
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
    backgroundColor: "rgba(79, 70, 229, 0.12)",
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
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.text.primary,
    marginBottom: 8,
  },
  blurContainer: {
    position: "relative",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
    overflow: "hidden",
  },
  blurText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
});
