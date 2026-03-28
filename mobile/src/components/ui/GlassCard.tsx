import { StyleSheet, View, ViewStyle, Platform, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";

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

      {/* Dynamic Metal Shine */}
      <MotiView
        from={{ translateX: -400 }}
        animate={{ translateX: 400 }}
        transition={{
          type: "timing",
          duration: 4000,
          loop: true,
          repeatReverse: false,
          delay: 1000,
        }}
        style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.08)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      {/* Reflective Edge Highlight */}
      <View style={[StyleSheet.absoluteFill, styles.borderHighlight]} />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  borderHighlight: {
    borderWidth: 1.5,
    borderColor: "transparent",
    borderTopColor: "rgba(255,255,255,0.1)",
    borderLeftColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
});
