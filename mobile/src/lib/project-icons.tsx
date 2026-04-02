import React from "react";
import {
  ChefHat,
  Bath,
  Paintbrush,
  Home,
  Grid,
  Toolbox,
} from "lucide-react-native";

export const PROJECT_ICONS = {
  Kitchen: ChefHat,
  Bathroom: Bath,
  Painting: Paintbrush,
  Roof: Home,
  Flooring: Grid,
  Other: Toolbox,
};

export function getProjectIcon(name: string = "") {
  const n = name.toLowerCase();
  if (n.includes("kitchen")) return PROJECT_ICONS.Kitchen;
  if (n.includes("bath")) return PROJECT_ICONS.Bathroom;
  if (n.includes("paint")) return PROJECT_ICONS.Painting;
  if (n.includes("roof")) return PROJECT_ICONS.Roof;
  if (n.includes("floor") || n.includes("tile")) return PROJECT_ICONS.Flooring;
  return PROJECT_ICONS.Other;
}

export function ProjectIcon({
  name,
  size = 16,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const n = name.toLowerCase();

  if (n.includes("kitchen")) return <ChefHat size={size} color={color} />;
  if (n.includes("bath")) return <Bath size={size} color={color} />;
  if (n.includes("paint")) return <Paintbrush size={size} color={color} />;
  if (n.includes("roof")) return <Home size={size} color={color} />;
  if (n.includes("floor") || n.includes("tile"))
    return <Grid size={size} color={color} />;

  return <Toolbox size={size} color={color} />;
}
