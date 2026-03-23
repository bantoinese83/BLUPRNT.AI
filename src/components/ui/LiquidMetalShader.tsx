import { useEffect, useRef } from "react";
import { ShaderMount, liquidMetalFragmentShader } from "@paper-design/shaders";


interface LiquidMetalShaderProps {
  className?: string;
  repetition?: number;
  softness?: number;
  shiftRed?: number;
  shiftBlue?: number;
  distortion?: number;
  contour?: number;
  angle?: number;
  scale?: number;
  shape?: number;
  offsetX?: number;
  offsetY?: number;
  playState?: number;
}

export function LiquidMetalShader({
  className = "",
  repetition = 1.5,
  softness = 0.5,
  shiftRed = 0.3,
  shiftBlue = 0.3,
  distortion = 0,
  contour = 0,
  angle = 100,
  scale = 1.5,
  shape = 1,
  offsetX = 0.1,
  offsetY = -0.1,
  playState = 0.6
}: LiquidMetalShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shaderMountRef = useRef<ShaderMount | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a wrapper div to ensure the canvas sizing is correct
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.position = "relative";
    containerRef.current.appendChild(wrapper);

    const shaderMount = new ShaderMount(
      wrapper,
      liquidMetalFragmentShader,
      {
        u_repetition: repetition,
        u_softness: softness,
        u_shiftRed: shiftRed,
        u_shiftBlue: shiftBlue,
        u_distortion: distortion,
        u_contour: contour,
        u_angle: angle,
        u_scale: scale,
        u_shape: shape,
        u_offsetX: offsetX,
        u_offsetY: offsetY
      },
      undefined,
      playState
    );

    shaderMountRef.current = shaderMount;

    return () => {
      if (shaderMountRef.current) {
        // ShaderMount doesn't have an explicit destroy, but clearing refs and DOM helps
        shaderMountRef.current = null;
      }
      if (containerRef.current && wrapper) {
        containerRef.current.removeChild(wrapper);
      }
    };
  }, [
    repetition,
    softness,
    shiftRed,
    shiftBlue,
    distortion,
    contour,
    angle,
    scale,
    shape,
    offsetX,
    offsetY,
    playState
  ]);

  return (
    <div 
      ref={containerRef} 
      className={`liquid-metal-host ${className}`}
      style={{ isolation: 'isolate' }}
    />
  );
}
