import {
  StyleSheet,
  View,
  ViewStyle,
  Platform,
  StyleProp,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Theme } from "../../constants/Theme";

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
  intensity = 20,
  onPress,
  activeOpacity = 0.85,
}: Props) {
  const CardContent = (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint="systemUltraThinMaterial"
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
        colors={["rgba(255, 255, 255, 0.15)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
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
    borderRadius: Theme.radius.xl, // Slightly rounder for premium feel
    overflow: "hidden",
    backgroundColor: Theme.colors.glass.bg,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: "#042f2e",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  borderHighlight: {
    borderWidth: 1.2,
    borderColor: "transparent",
    borderTopColor: "rgba(255,255,255,0.3)",
    borderLeftColor: "rgba(255,255,255,0.15)",
    borderRightColor: "rgba(0,0,0,0.01)",
    borderRadius: Theme.radius.xl,
  },
  childContainer: {
    width: "100%",
    position: "relative",
    zIndex: 1,
  },
  content: {
    padding: 20,
  },
});
