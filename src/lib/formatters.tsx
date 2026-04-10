import { Star } from "lucide-react";

export { money } from "@shared/lib/formatters";

export function getStars(score: number | null) {
  const n = score != null ? Math.min(5, Math.max(0, Math.round(score))) : 3;
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-3 h-3 ${i < n ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
    />
  ));
}
