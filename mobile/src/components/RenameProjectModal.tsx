import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { showAppToast } from "@/lib/app-toast";

type Props = {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
};

export function RenameProjectModal({
  visible,
  initialName,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.centerWrap}>
          <Pressable style={styles.scrim} onPress={onClose} />
          <View style={styles.sheetOuter}>
            <View style={styles.sheet}>
              <Text style={styles.title}>Rename project</Text>
              <Text style={styles.subtitle}>
                This name appears on your dashboard and exports.
              </Text>
              <TextInput
                testID="rename-project-input"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Project name"
                placeholderTextColor={Theme.colors.text.muted}
                autoFocus
                autoCorrect={false}
                editable={!saving}
              />
              <View style={styles.row}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.half}
                  titleCase="sentence"
                  disabled={saving}
                />
                <Button
                  title={saving ? "Saving..." : "Save"}
                  onPress={async () => {
                    const t = name.trim();
                    if (!t || saving) return;
                    setSaving(true);
                    try {
                      await onSave(t);
                    } catch (err) {
                      console.error("Rename project error:", err);
                      showAppToast("Failed to rename project.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={!name.trim() || saving}
                  loading={saving}
                  style={styles.half}
                  titleCase="sentence"
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    gap: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.primary,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  half: {
    flex: 1,
  },
});
