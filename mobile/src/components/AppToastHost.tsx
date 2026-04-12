import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { registerAppToastHandler } from "@/lib/app-toast";
import { Theme } from "@/constants/Theme";

const DISPLAY_MS = 3200;

export function AppToastHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  useEffect(() => {
    registerAppToastHandler(show);
    return () => registerAppToastHandler(null);
  }, [show]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), DISPLAY_MS);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 16) + 56 }]}
      pointerEvents="none"
    >
      <View style={styles.pill}>
        <Text style={styles.text}>{message}</Text>
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
  pill: {
    maxWidth: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    color: "#f8fafc",
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    textAlign: "center",
    lineHeight: 20,
  },
});
