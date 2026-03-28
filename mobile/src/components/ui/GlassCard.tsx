import { StyleSheet, View, ViewStyle, Platform, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Theme } from "../../constants/Theme";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 20 }: Props) {
  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
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
          colors={["transparent", "rgba(255, 255, 255, 0.12)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      {/* Internal Polish / Depth Glow */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.05)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Reflective Edge Highlight */}
      <View style={[StyleSheet.absoluteFill, styles.borderHighlight]} />

      <View style={styles.childContainer}>{children}</View>
    </View>
  );
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  borderHighlight: {
    borderWidth: 1.2,
    borderColor: "transparent",
    borderTopColor: Theme.colors.glass.highlight,
    borderLeftColor: "rgba(255,255,255,0.08)",
    borderRightColor: "rgba(255,255,255,0.02)",
    borderRadius: Theme.radius.xl,
  },
  childContainer: {
    // No default padding to allow flexible content layout
  },
  content: {
    padding: 20,
  },
});
