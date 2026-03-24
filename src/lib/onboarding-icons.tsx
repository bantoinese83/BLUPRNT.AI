import type { LucideIcon } from "lucide-react";
import {
  Bath,
  ChefHat,
  ClipboardList,
  FileStack,
  Grid3x3,
  Hammer,
  MoreHorizontal,
  Paintbrush,
  Home,
} from "lucide-react";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";

export const PROJECT_TYPE_ICON: Record<ProjectTypeOption, LucideIcon> = {
  Kitchen: ChefHat,
  Bathroom: Bath,
  Painting: Paintbrush,
  Roof: Home,
  Flooring: Grid3x3,
  "Something else": MoreHorizontal,
};

export const STAGE_ICON: Record<StageOption, LucideIcon> = {
  "Just planning": ClipboardList,
  "Collecting quotes": FileStack,
  "Already started work": Hammer,
};
