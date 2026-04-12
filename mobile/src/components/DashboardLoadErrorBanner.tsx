import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, RefreshCw, X } from "lucide-react-native";
import { Theme } from "@/constants/Theme";

type Props = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
};

export function DashboardLoadErrorBanner({
  message,
  onRetry,
  onDismiss,
}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <AlertTriangle size={18} color={Theme.colors.status.warning} />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={styles.btn}
        accessibilityLabel="Retry loading"
      >
        <RefreshCw size={16} color={Theme.colors.brand.primary} />
        <Text style={styles.btnLabel}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={12}
        accessibilityLabel="Dismiss message"
      >
        <X size={18} color={Theme.colors.text.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(254, 243, 199, 0.95)",
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.5)",
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
    color: "#78350f",
    lineHeight: 18,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  btnLabel: {
    fontSize: 13,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
});
