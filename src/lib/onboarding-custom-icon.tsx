import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type OnboardingCustomIconProps = {
  src: string;
  className?: string;
  /** Full-color SVGs from /public/assets (default). Use `onDark` for white glyph on dark fills only. */
  variant?: "color" | "onDark";
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "className">;

export function OnboardingCustomIcon({
  src,
  className,
  variant = "color",
  ...props
}: OnboardingCustomIconProps) {
  return (
    <img
      src={src}
      className={cn(
        "max-h-full max-w-full object-contain select-none",
        className,
      )}
      alt=""
      style={
        variant === "onDark" ? { filter: "brightness(0) invert(1)" } : undefined
      }
      {...props}
    />
  );
}
