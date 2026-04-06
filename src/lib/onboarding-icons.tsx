import { OnboardingCustomIcon } from "@/lib/onboarding-custom-icon";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";

interface IconProps {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}

// We use relative paths from public/
export const PROJECT_TYPE_ICON: Record<
  ProjectTypeOption,
  (props: IconProps) => React.ReactNode
> = {
  Kitchen: (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/043-kitchen cabinet.svg"
      {...props}
    />
  ),
  Bathroom: (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/004-bathroom.svg"
      {...props}
    />
  ),
  Painting: (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/054-paint brush.svg"
      {...props}
    />
  ),
  Roof: (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/042-house.svg"
      {...props}
    />
  ),
  Flooring: (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/030-tiles.svg"
      {...props}
    />
  ),
  "Something else": (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/079-tool box.svg"
      {...props}
    />
  ),
};

export const STAGE_ICON: Record<
  StageOption,
  (props: IconProps) => React.ReactNode
> = {
  "Just planning": (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/060-project.svg"
      {...props}
    />
  ),
  "Collecting quotes": (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/033-quotes.svg"
      {...props}
    />
  ),
  "Already started work": (props: IconProps) => (
    <OnboardingCustomIcon
      src="/assets/icons/home-improvements/009-builder.svg"
      {...props}
    />
  ),
};

export function getProjectIcon(
  name: string = "",
): (props: IconProps) => React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes("kitchen")) return PROJECT_TYPE_ICON.Kitchen;
  if (n.includes("bath")) return PROJECT_TYPE_ICON.Bathroom;
  if (n.includes("paint")) return PROJECT_TYPE_ICON.Painting;
  if (n.includes("roof")) return PROJECT_TYPE_ICON.Roof;
  if (n.includes("floor") || n.includes("tile"))
    return PROJECT_TYPE_ICON.Flooring;
  return PROJECT_TYPE_ICON["Something else"];
}
