import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";

interface Props {
  visible: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function FloatingActionButton({ visible, onPress, disabled }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.5, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.5, translateY: 20 }}
          transition={{ type: "spring", damping: 15 }}
          style={styles.container}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPress();
            }}
            disabled={disabled}
            style={[
              styles.button,
              disabled && {
                opacity: 0.7,
                backgroundColor: Theme.colors.text.muted,
              },
            ]}
          >
            <Plus size={28} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 24,
    bottom: 24,
    zIndex: 999,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.brand,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
