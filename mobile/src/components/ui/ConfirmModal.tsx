import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: "destructive" | "primary";
  loading?: boolean;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "primary",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.centerWrap}>
        <Pressable style={styles.scrim} onPress={onCancel} />
        <View style={styles.sheetOuter}>
          <View style={styles.sheet}>
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{message}</Text>
            </View>
            <View style={styles.actions}>
              <Button
                title={cancelLabel}
                variant="outline"
                onPress={onCancel}
                style={styles.actionButton}
                titleCase="sentence"
                disabled={loading}
              />
              <Button
                title={confirmLabel}
                variant={variant === "destructive" ? "destructive" : "primary"}
                onPress={onConfirm}
                loading={loading}
                disabled={loading}
                style={styles.actionButton}
                titleCase="sentence"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetOuter: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  sheet: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
  /**
   * Stacked actions: a horizontal row with two flex-1 buttons collapses the
   * second button to zero width on RN when labels differ (minWidth default).
   */
  actions: {
    width: "100%",
    gap: 12,
  },
  actionButton: {
    width: "100%",
    height: 48,
    alignSelf: "stretch",
  },
});
