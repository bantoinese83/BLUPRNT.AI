import { Star } from "lucide-react";

export function money(
  a: number | null | undefined,
  b?: number | null | undefined,
): string {
  const fmt = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  };

  const valA = a != null && Number.isFinite(a) ? a : null;
  const valB = b != null && Number.isFinite(b) ? b : null;

  if (valA !== null && valB !== null) {
    if (valA === valB) return fmt(valA);
    return `${fmt(valA)} – ${fmt(valB)}`;
  }
  if (valA !== null) return fmt(valA);
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
