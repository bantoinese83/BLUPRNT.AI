import React, { useEffect, useId, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { MotiView } from "moti";
import { Logo } from "@/components/ui/Logo";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Same path as web `Loader` / CodePen Snurra */
const SNU_PATH =
  "m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64";

const OFFSET = -403;

const TONE_STOPS = {
  /** Matches web `.bluprnt-snurra-stop-a/b` */
  brand: { a: "#2dd4bf", b: "#134e4a" },
  /** High contrast on teal / primary CTA fills */
  onPrimary: { a: "#ecfdf5", b: "#99f6e4" },
  /** Destructive actions (e.g. delete) */
  destructive: { a: "#fda4af", b: "#be123c" },
} as const;

export type SnurraTone = keyof typeof TONE_STOPS;

type Props = {
  /** Display size in dp (viewBox 200×200 scales uniformly). */
  size?: number;
  tone?: SnurraTone;
  style?: ViewStyle;
  /** When set, exposes progressbar semantics for full-screen / standalone use. */
  accessibilityLabel?: string;
  /** Center mark — matches web `Loader` `showLogo` (logo inside the ring). */
  showLogo?: boolean;
  /** Logo dp; defaults to ~36% of ring size (web `Loader` proportions). */
  logoSize?: number;
};

export function SnurraLoader({
  size = 120,
  tone = "brand",
  style,
  accessibilityLabel,
  showLogo = false,
  logoSize: logoSizeProp,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const gradId = `snurra-grad-${reactId}`;
  const stops = TONE_STOPS[tone];
  const shadowOffset = Math.max(1, Math.round(size * 0.015));

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const slow = useSharedValue(0);
  const fast = useSharedValue(0);

  useEffect(() => {
    /* Reanimated: shared values update via `.value` (not React state). */
    if (reduceMotion) {
      cancelAnimation(slow);
      cancelAnimation(fast);
      slow.value = 0;
      fast.value = 0;
    } else {
      cancelAnimation(slow);
      cancelAnimation(fast);
      slow.value = 0;
      fast.value = 0;
      slow.value = withRepeat(
        withTiming(OFFSET, { duration: 10_000, easing: Easing.linear }),
        -1,
        false,
      );
      fast.value = withRepeat(
        withTiming(OFFSET, { duration: 3000, easing: Easing.linear }),
        -1,
        false,
      );
    }
    const cleanup = () => {
      cancelAnimation(slow);
      cancelAnimation(fast);
    };
    return cleanup;
  }, [reduceMotion, slow, fast]);

  const pathAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: slow.value,
  }));
  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: fast.value,
  }));

  const strokeUrl = useMemo(() => `url(#${gradId})`, [gradId]);
  const logoSize = logoSizeProp ?? Math.max(40, Math.round(size * 0.5));

  const gradient = (
    <Defs>
      <LinearGradient
        id={gradId}
        x1="40"
        y1="40"
        x2="160"
        y2="160"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0" stopColor={stops.a} />
        <Stop offset="1" stopColor={stops.b} />
      </LinearGradient>
    </Defs>
  );

  return (
    <View
      style={[styles.wrap, { width: size, height: size }, style]}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "progressbar" : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {gradient}
        <G opacity={0.28} translateX={shadowOffset} translateY={shadowOffset}>
          <AnimatedPath
            d={SNU_PATH}
            stroke={strokeUrl}
            strokeWidth={23}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="180 800"
            animatedProps={pathAnimatedProps}
          />
          <AnimatedCircle
            cx="100"
            cy="100"
            r="64"
            stroke={strokeUrl}
            strokeWidth={23}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="26 54"
            animatedProps={circleAnimatedProps}
          />
        </G>
        <AnimatedPath
          d={SNU_PATH}
          stroke={strokeUrl}
          strokeWidth={23}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="180 800"
          animatedProps={pathAnimatedProps}
        />
        <AnimatedCircle
          cx="100"
          cy="100"
          r="64"
          stroke={strokeUrl}
          strokeWidth={23}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="26 54"
          animatedProps={circleAnimatedProps}
        />
      </Svg>
      {showLogo ? (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.logoCenter}>
            <MotiView
              from={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 480, delay: 120 }}
            >
              <Logo size={logoSize} />
            </MotiView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

export { SnurraSize } from "@/components/ui/snurra-sizes";
