import { Image } from "expo-image";
import kitchen from "../../assets/onboarding/kitchen.svg";
import bathroom from "../../assets/onboarding/bathroom.svg";
import paint from "../../assets/onboarding/paint.svg";
import roof from "../../assets/onboarding/roof.svg";
import flooring from "../../assets/onboarding/flooring.svg";
import other from "../../assets/onboarding/other.svg";
import stagePlanning from "../../assets/onboarding/stage-planning.svg";
import stageQuotes from "../../assets/onboarding/stage-quotes.svg";
import stageWork from "../../assets/onboarding/stage-work.svg";

const TYPE_SOURCES: Record<string, number> = {
  kitchen,
  bathroom,
  paint,
  roof,
  flooring,
  other,
};

function typeKey(name: string): keyof typeof TYPE_SOURCES {
  const n = name.toLowerCase();
  if (n.includes("kitchen")) return "kitchen";
  if (n.includes("bath")) return "bathroom";
  if (n.includes("paint")) return "paint";
  if (n.includes("roof")) return "roof";
  if (n.includes("floor") || n.includes("tile")) return "flooring";
  return "other";
}

function stageSource(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("collecting quotes")) return stageQuotes;
  if (n.includes("already started")) return stageWork;
  return stagePlanning;
}

/**
 * Project-type and onboarding-stage illustrations from `public/assets` (bundled under `mobile/assets/onboarding`).
 */
export function ProjectIcon({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const n = name.toLowerCase();
  const isStage =
    n.includes("planning") ||
    n.includes("collecting quotes") ||
    n.includes("already started");

  const source = isStage ? stageSource(name) : TYPE_SOURCES[typeKey(name)];

  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
