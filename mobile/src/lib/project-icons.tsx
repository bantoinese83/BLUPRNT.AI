import {
  Bath,
  ChefHat,
  Grid,
  Home,
  Paintbrush,
  Toolbox,
} from "lucide-react-native";

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
