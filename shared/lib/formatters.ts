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

  const valA = a != null && Number.isFinite(a) ? (a as number) : null;
  const valB = b != null && Number.isFinite(b) ? (b as number) : null;

  if (valA !== null && valB !== null) {
    const [low, high] = valA <= valB ? [valA, valB] : [valB, valA];
    if (low === high) return fmt(low);
    return `${fmt(low)} – ${fmt(high)}`;
  }
  if (valA !== null) return fmt(valA);
  return "—";
}

/** US short date for PDFs and exports (e.g. Apr 18, 2026). */
export function formatShortUsDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Returns days remaining until a warranty expires, or null if expired/unset.
 */
export function getWarrantyStatus(expiryIso: string | null | undefined): {
  daysRemaining: number;
  isExpired: boolean;
  label: string;
} | null {
  if (!expiryIso) return null;
  const expiry = new Date(expiryIso).getTime();
  const now = Date.now();
  const diffMs = expiry - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { daysRemaining: days, isExpired: true, label: "Expired" };
  }
  if (days > 365) {
    const years = (days / 365).toFixed(1);
    return {
      daysRemaining: days,
      isExpired: false,
      label: `${years}y remaining`,
    };
  }
  return {
    daysRemaining: days,
    isExpired: false,
    label: `${days}d remaining`,
  };
}
