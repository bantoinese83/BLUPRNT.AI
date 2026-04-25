import { Image, type ImageStyle } from "expo-image";
import { type StyleProp } from "react-native";
import logoSource from "../../../assets/images/android-icon-foreground.png";

interface Props {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Logo({ size = 60, style }: Props) {
  return (
    <Image
      source={logoSource}
      style={[
        { width: size, height: size, backgroundColor: "transparent" },
        style,
      ]}
      contentFit="contain"
      transition={200}
    />
  );
}
