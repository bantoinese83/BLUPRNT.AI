import React from "react";
import { Image } from "expo-image";
import type { ImageStyle, StyleProp } from "react-native";
import SRC_ARCHITECT from "@assets/plan-architect.svg";
import SRC_PASS from "@assets/plan-pass.svg";

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function ArchitectPlanIcon({ size = 28, style }: Props) {
  return (
    <Image
      source={SRC_ARCHITECT}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessibilityRole="image"
      accessibilityLabel="Architect plan"
    />
  );
}

export function ProjectPassIcon({ size = 28, style }: Props) {
  return (
    <Image
      source={SRC_PASS}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessibilityRole="image"
      accessibilityLabel="Project Pass"
    />
  );
}
