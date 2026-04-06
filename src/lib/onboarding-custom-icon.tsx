import type { ImgHTMLAttributes } from "react";

export type OnboardingCustomIconProps = {
  src: string;
  className?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "className" | "alt">;

export function OnboardingCustomIcon({
  src,
  className,
  ...props
}: OnboardingCustomIconProps) {
  return (
    <img
      src={src}
      className={className}
      alt=""
      style={{ filter: "brightness(0) invert(1)" }}
      {...props}
    />
  );
}
