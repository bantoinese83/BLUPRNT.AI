import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* Base Deep Space Gradient */}
      <LinearGradient
        colors={["#020617", "#0f172a", "#1e1b4b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Brumbient Glow (Top Left) */}
      <LinearGradient
        colors={["rgba(79, 70, 229, 0.15)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={styles.gradient}
      />

      {/* Subtle Bottom Glow */}
      <LinearGradient
        colors={["transparent", "rgba(15, 23, 42, 0.5)"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />

      {/* NEW: Bottom Right Accent Glow */}
      <LinearGradient
        colors={["transparent", "rgba(79, 70, 229, 0.08)"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
