import { Star } from "lucide-react";

export function money(a: number | null, b?: number | null): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  if (a != null && b != null) return `${fmt(a)} – ${fmt(b)}`;
  if (a != null) return fmt(a);
  return "—";
}

export function getStars(score: number | null) {
  const n = score != null ? Math.min(5, Math.max(0, Math.round(score))) : 3;
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-3 h-3 ${i < n ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
    />
  ));
}
