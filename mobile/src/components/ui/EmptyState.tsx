import React from "react";
import { StyleSheet, View, Text, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { MotiView } from "moti";
import { Theme } from "../../constants/Theme";
import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  /** Calmer second path (e.g. explore the flow before committing). */
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
            onPress={onAction}
            style={styles.button}
          />
        )}

        {secondaryTitle && onSecondary && (
          <Button
            title={secondaryTitle}
            onPress={onSecondary}
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
    padding: 32,
    alignItems: "center",
    width: "100%",
    borderRadius: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: "Outfit_800ExtraBold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
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
    marginTop: 40,
    paddingTop: 32,
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
    fontFamily: "Outfit_800ExtraBold",
    color: "#94a3b8",
  },
  roadmapLabel: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#94a3b8",
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
