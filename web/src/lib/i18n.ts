export function getAppLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en-US";
}

export function formatCurrency(
  amount: number,
  options?: {
    locale?: string;
    currency?: string;
    maximumFractionDigits?: number;
  },
): string {
  const locale = options?.locale ?? getAppLocale();
  const currency = options?.currency ?? "USD";
  const maximumFractionDigits = options?.maximumFractionDigits ?? 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount);
}

export function formatCompactNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? getAppLocale(), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
