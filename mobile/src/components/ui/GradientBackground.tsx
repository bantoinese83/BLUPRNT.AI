import React from "react";
import { StyleSheet, View, ViewStyle, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* Base Light Liquid Gradient */}
      <LinearGradient
        colors={["#f8fafc", "#f1f5f9", "#e2e8f0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Ambient Pulsing Glow 1 (Top Left) */}
      <MotiView
        from={{ opacity: 0.1, scale: 1 }}
        animate={{ opacity: 0.25, scale: 1.2 }}
        transition={{
          type: "timing",
          duration: 8000,
          loop: true,
          repeatReverse: true,
        }}
        style={styles.absolute}
      >
        <LinearGradient
          colors={["rgba(79, 70, 229, 0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={styles.glow}
        />
      </MotiView>

      {/* Ambient Pulsing Glow 2 (Bottom Right) */}
      <MotiView
        from={{ opacity: 0.05, translateX: 0 }}
        animate={{ opacity: 0.15, translateX: 50 }}
        transition={{
          type: "timing",
          duration: 12000,
          loop: true,
          repeatReverse: true,
        }}
        style={styles.absolute}
      >
        <LinearGradient
          colors={["transparent", "rgba(79, 70, 229, 0.05)"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
        />
      </MotiView>

      {/* Fixed Grain Overlay (Extremely subtle) */}
      <View
        style={[styles.gradient, { opacity: 0.01, backgroundColor: "#000" }]}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  absolute: {
    position: "absolute",
    width: width * 1.5,
    height: height * 1.5,
    top: -height * 0.25,
    left: -width * 0.25,
  },
  glow: {
    flex: 1,
  },
});
