/**
 * Semver-ish compare: major.minor.patch numeric segments only.
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareSemverParts(
  v1: string | unknown,
  v2: string | unknown,
): number {
  const normalize = (v: unknown): number[] => {
    if (typeof v !== "string") return [0, 0, 0];
    return v
      .split(".")
      .slice(0, 3)
      .map((p) => {
        const n = Number.parseInt(p.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? n : 0;
      });
  };

  const parts1 = normalize(v1);
  const parts2 = normalize(v2);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/** Normalize `app_config.value` (jsonb string, plain string, etc.) to a semver token. */
export function minSemverFromAppConfigValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim().replace(/^["']|["']$/g, "");
    return t.length > 0 ? t : null;
  }
  const s = String(value)
    .trim()
    .replace(/^["']|["']$/g, "");
  return s.length > 0 ? s : null;
}
