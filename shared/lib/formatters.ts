/**
 * Shared formatting utilities for Web and Mobile.
 */

/**
 * Formats a number (or range) as USD currency with no decimal places.
 */
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

/** US short date for PDFs and exports (e.g. Apr 18, 2026). */
export function formatShortUsDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
