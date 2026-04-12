import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Lock, Lightbulb, ArrowRight } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Theme } from "@/constants/Theme";

interface Props {
  projectName: string;
  onUpgradePress: () => void;
}

export function InsightTeaser({ projectName, onUpgradePress }: Props) {
  return (
    <GlassCard style={styles.cardOuter} intensity={25}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <Lock size={18} color={Theme.colors.brand.primary} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Architect Insight</Text>
            <Lightbulb
              size={12}
              color={Theme.colors.brand.primary}
              style={styles.badgeSparkle}
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
          style={styles.cta}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: Theme.spacing.margin,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.radius.sm,
  },
  badgeSparkle: {
    marginLeft: Theme.spacing.xs / 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  blurContainer: {
    position: "relative",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.sm,
    overflow: "hidden",
  },
  blurText: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 22,
  },
  cta: {
    marginTop: Theme.spacing.md,
  },
});
