import React, { useEffect, useState, useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  registerAppToastHandler,
  type AppToastType,
  type ShowAppToastOptions,
} from "@/lib/app-toast";
import { Theme } from "@/constants/Theme";

const DISPLAY_MS = 3200;

type ToastState = {
  message: string;
  type: AppToastType;
} | null;

export function AppToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback((msg: string, options?: ShowAppToastOptions) => {
    setToast({
      message: msg,
      type: options?.type ?? "neutral",
    });
  }, []);

  useEffect(() => {
    registerAppToastHandler(show);
    return () => registerAppToastHandler(null);
  }, [show]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), DISPLAY_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const palette = useMemo(() => {
    if (!toast) return null;
    switch (toast.type) {
      case "success":
        return {
          pill: { backgroundColor: Theme.colors.status.success },
          text: { color: "#ffffff" },
        };
      case "error":
        return {
          pill: { backgroundColor: Theme.colors.status.error },
          text: { color: "#ffffff" },
        };
      case "warning":
        return {
          pill: { backgroundColor: Theme.colors.status.warning },
          text: { color: Theme.colors.text.primary },
        };
      default:
        return {
          pill: styles.pillNeutral,
          text: styles.textNeutral,
        };
    }
  }, [toast]);

  if (!toast || !palette) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 16) + 56 }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessibilityLabel={toast.message}
    >
      <View style={[styles.pillBase, palette.pill]}>
        <Text style={[styles.textBase, palette.text]}>{toast.message}</Text>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 10000,
    alignItems: "center",
  },
  pillBase: {
    maxWidth: "100%",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pillNeutral: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
  },
  textBase: {
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    textAlign: "center",
    lineHeight: 20,
  },
  textNeutral: {
    color: "#f8fafc",
  },
});
