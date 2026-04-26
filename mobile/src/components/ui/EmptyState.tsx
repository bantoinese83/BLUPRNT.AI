import React from "react";
import { StyleSheet, View, Text, type ViewStyle } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionTitle?: string;
  /** Primary CTA label casing. Default uppercase to match buttons elsewhere. */
  actionTitleCase?: "uppercase" | "sentence";
  onAction?: () => void;
  /** Optional second action (prefer a single primary CTA unless paths are truly different). */
  secondaryTitle?: string;
  onSecondary?: () => void;
  style?: ViewStyle;
  withRoadmap?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionTitle,
  actionTitleCase = "uppercase",
  onAction,
  secondaryTitle,
  onSecondary,
  style,
  withRoadmap = false,
}: EmptyStateProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 800 }}
      style={[styles.container, style]}
    >
      <GlassCard intensity={15} style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon
            size={40}
            color={Theme.colors.brand.primary}
            strokeWidth={1.5}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {actionTitle && onAction && (
          <Button
            title={actionTitle}
            titleCase={actionTitleCase}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAction();
            }}
            style={styles.button}
          />
        )}

        {secondaryTitle && onSecondary && (
          <Button
            title={secondaryTitle}
            onPress={() => {
              Haptics.selectionAsync();
              onSecondary();
            }}
            variant="outline"
            style={styles.secondaryButton}
          />
        )}

        {withRoadmap && (
          <View style={styles.roadmapContainer}>
            <View style={styles.roadmapStep}>
              <View style={[styles.roadmapDot, styles.activeDot]}>
                <Text style={[styles.roadmapNumber, styles.activeNumber]}>
                  1
                </Text>
              </View>
              <Text style={[styles.roadmapLabel, styles.activeLabel]}>
                Vision
              </Text>
            </View>
            <View style={styles.roadmapLine} />
            <View style={styles.roadmapStep}>
              <View style={styles.roadmapDot}>
                <Text style={styles.roadmapNumber}>2</Text>
              </View>
              <Text style={styles.roadmapLabel}>Estimate</Text>
            </View>
            <View style={styles.roadmapLine} />
            <View style={styles.roadmapStep}>
              <View style={styles.roadmapDot}>
                <Text style={styles.roadmapNumber}>3</Text>
              </View>
              <Text style={styles.roadmapLabel}>Ledger</Text>
            </View>
          </View>
        )}
      </GlassCard>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  card: {
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderRadius: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(13, 148, 136, 0.15)", // Theme.colors.brand.primary at 15% opacity
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    height: 56,
  },
  secondaryButton: {
    width: "100%",
    height: 52,
    marginTop: 12,
  },
  roadmapContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    width: "100%",
  },
  roadmapStep: {
    alignItems: "center",
    gap: 8,
  },
  roadmapDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.divider,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  activeDot: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: Theme.colors.brand.primary,
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  activeNumber: {
    color: "#ffffff",
  },
  roadmapNumber: {
    fontSize: 12,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
  },
  roadmapLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: Theme.colors.brand.primary,
  },
  roadmapLine: {
    width: 30,
    height: 1,
    backgroundColor: Theme.colors.border,
    marginHorizontal: 8,
    marginBottom: 20, // Align with dots
  },
});
