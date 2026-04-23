import confetti from "canvas-confetti";

/** Above app chrome / sidebars (stacking contexts). */
const CONFETTI_Z = 2147483000;

const baseOpts = {
  zIndex: CONFETTI_Z,
  disableForReducedMotion: true,
} as const;

function toColorArray(colors: readonly string[]): string[] {
  return [...colors];
}

/**
 * Full-viewport celebration: side cannons (x=0 / x=1) plus short corner “fireworks” bursts.
 * `canvas-confetti` origins are normalized to the window (0–1); z-index keeps the canvas on top.
 */
export function runViewportCelebration(colors: readonly string[]): void {
  if (typeof window === "undefined") return;

  const colorArray = toColorArray(colors);
  const cannonEnd = Date.now() + 2400;

  const cannonFrame = () => {
    if (Date.now() > cannonEnd) return;
    void confetti({
      ...baseOpts,
      particleCount: 2,
      angle: 60,
      spread: 58,
      startVelocity: 58,
      origin: { x: 0, y: 0.55 },
      colors: colorArray,
    });
    void confetti({
      ...baseOpts,
      particleCount: 2,
      angle: 120,
      spread: 58,
      startVelocity: 58,
      origin: { x: 1, y: 0.55 },
      colors: colorArray,
    });
    requestAnimationFrame(cannonFrame);
  };
  cannonFrame();

  const duration = 2200;
  const animationEnd = Date.now() + duration;
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }
    const particleCount = 42 * (timeLeft / duration);
    void confetti({
      ...baseOpts,
      startVelocity: 26,
      spread: 360,
      ticks: 52,
      particleCount,
      origin: {
        x: randomInRange(0.08, 0.32),
        y: randomInRange(0.12, 0.38),
      },
      colors: colorArray,
    });
    void confetti({
      ...baseOpts,
      startVelocity: 26,
      spread: 360,
      ticks: 52,
      particleCount,
      origin: {
        x: randomInRange(0.68, 0.92),
        y: randomInRange(0.12, 0.38),
      },
      colors: colorArray,
    });
  }, 220);
  window.setTimeout(() => window.clearInterval(interval), duration + 400);
}
