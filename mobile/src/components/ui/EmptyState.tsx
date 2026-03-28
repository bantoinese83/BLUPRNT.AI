import React from "react";
import { StyleSheet, View, Text, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { MotiView } from "moti";
import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
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
          <Icon size={40} color="#4f46e5" strokeWidth={1.5} />
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
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    width: "100%",
    height: 56,
  },
});
