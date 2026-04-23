import React from "react";
import { View, type ViewStyle, Image } from "react-native";
import logoSource from "../../../assets/images/icon.png";

interface Props {
  size?: number;
  style?: ViewStyle;
}

export function Logo({ size = 40, style }: Props) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={logoSource}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );
}
