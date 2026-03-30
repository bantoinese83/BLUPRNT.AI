import React from "react";
import { View, StyleSheet, Dimensions, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

interface Props {
  width?: number;
  height?: number;
  cutoutRadius?: number;
  style?: ViewStyle;
}

export function TabShape({
  width = Dimensions.get("window").width,
  height = 64,
  cutoutRadius = 36,
  style,
}: Props) {
  const margin = 12; // Dock margin from screen edges
  const r = 32; // Corner radius of the floating bar
  const center = width / 2; // Absolute screen center

  // Precise path drawn within screen-wide coordinates to ensure perfect center sync
  const d = `
    M ${margin + r} 0
    L ${center - cutoutRadius - 15} 0
    C ${center - cutoutRadius - 5} 0, ${center - cutoutRadius} 5, ${center - cutoutRadius} 15
    A ${cutoutRadius} ${cutoutRadius} 0 0 0 ${center + cutoutRadius} 15
    C ${center + cutoutRadius} 5, ${center + cutoutRadius + 5} 0, ${center + cutoutRadius + 15} 0
    L ${width - margin - r} 0
    Q ${width - margin} 0, ${width - margin} ${r}
    L ${width - margin} ${height - r}
    Q ${width - margin} ${height}, ${width - margin - r} ${height}
    L ${margin + r} ${height}
    Q ${margin} ${height}, ${margin} ${height - r}
    L ${margin} ${r}
    Q ${margin} 0, ${margin + r} 0
    Z
  `;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={d}
          fill="rgba(255, 255, 255, 0.98)"
          stroke="rgba(0, 0, 0, 0.03)"
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "transparent",
  },
});
