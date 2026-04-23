import {
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Theme } from "@/constants/Theme";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  onPress?: () => void;
  activeOpacity?: number;
}

export function GlassCard({
  children,
  style,
  intensity = Theme.colors.glass.intensity,
  onPress,
  activeOpacity = 0.85,
}: Props) {
  const CardContent = (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint={Theme.colors.glass.tint}
        style={StyleSheet.absoluteFill}
      />

      {/* Dynamic Metal Shine - Faster and more localized */}
      <MotiView
        from={{ translateX: -300, opacity: 0 }}
        animate={{ translateX: 300, opacity: 0.15 }}
        transition={{
          type: "timing",
          duration: 3000,
          loop: true,
          repeatReverse: false,
          delay: 1500,
        }}
        style={[StyleSheet.absoluteFill]}
      >
        <LinearGradient
          colors={["transparent", "rgba(15, 23, 42, 0.04)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      {/* Internal Polish / Depth Glow */}
      <LinearGradient
        colors={[Theme.colors.glass.highlight, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Reflective Edge Highlight */}
      <View style={[StyleSheet.absoluteFill, styles.borderHighlight]} />

      <View style={styles.childContainer}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={activeOpacity}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.radius.xl,
    overflow: "hidden",
    backgroundColor: Theme.colors.glass.bg,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.spatial,
  },
  borderHighlight: {
    borderWidth: 1.5,
    borderColor: "transparent",
    borderTopColor: "rgba(255,255,255,0.4)",
    borderLeftColor: "rgba(255,255,255,0.2)",
    borderRightColor: "rgba(0,0,0,0.02)",
    borderRadius: Theme.radius.xl,
  },
  childContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    zIndex: 1,
  },
  content: {
    padding: 20,
  },
});
