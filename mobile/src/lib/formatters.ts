/**
 * Formats a number as USD currency with no decimal places.
 */
export function money(a: number | null, b?: number | null): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  if (a !== null && b !== null && a !== undefined && b !== undefined) {
    return `${fmt(a)} – ${fmt(b)}`;
  }
  if (a !== null && a !== undefined) return fmt(a);
  return "—";
}
