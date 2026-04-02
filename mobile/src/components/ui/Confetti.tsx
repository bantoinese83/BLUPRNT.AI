import React, { useEffect, useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");

const COLORS = ["#6366f1", "#818cf8", "#4f46e5", "#c7d2fe", "#1e1b4b"];
const PARTICLE_COUNT = 40;

interface ParticleProps {
  delay: number;
}

function Particle({ delay }: ParticleProps) {
  const [config] = React.useState(() => {
    const s = Math.random() * 8 + 4;
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    const sx = width / 2;
    const sy = height * 0.6;
    const ex = Math.random() * width;
    const ey = -100 - Math.random() * 500;
    const rot = Math.random() * 360;
    return {
      size: s,
      color: c,
      startX: sx,
      startY: sy,
      endX: ex,
      endY: ey,
      rotate: rot,
    };
  });

  const { size, color, startX, startY, endX, endY, rotate } = config;

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0,
        translateX: startX,
        translateY: startY,
        rotate: "0deg",
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: 1,
        translateX: endX,
        translateY: endY,
        rotate: `${rotate}deg`,
      }}
      transition={{
        type: "timing",
        duration: 2500,
        delay,
      }}
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 4,
        },
      ]}
    />
  );
}

export function Confetti({ active }: { active: boolean }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (active) {
      // Small timeout to break the synchronous effect execution
      timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 3000);
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [active]);

  if (!isVisible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} delay={i * 50} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
