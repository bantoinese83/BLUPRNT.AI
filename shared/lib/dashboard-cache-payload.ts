import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
} from "../types/database";

/** Shape stored in sessionStorage (web) / AsyncStorage (mobile) after a successful dashboard load. */
export type CachedDashboardPayload = {
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  spendByCategory: Record<string, number>;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
};

export function parseCachedDashboardPayload(
  raw: string,
): CachedDashboardPayload | null {
  try {
    const o = JSON.parse(raw) as Partial<CachedDashboardPayload>;
    if (!o || typeof o !== "object") return null;
    return {
      projects: Array.isArray(o.projects) ? o.projects : [],
      project: o.project ?? null,
      scopeItems: Array.isArray(o.scopeItems) ? o.scopeItems : [],
      invoices: Array.isArray(o.invoices) ? o.invoices : [],
      spendByCategory:
        o.spendByCategory && typeof o.spendByCategory === "object"
          ? o.spendByCategory
          : {},
      isArchitect: Boolean(o.isArchitect),
      subscription: o.subscription ?? null,
      hasProjectPass: Boolean(o.hasProjectPass),
    };
  } catch {
    return null;
  }
}

/** True when cached JSON has a usable projects list (skip first-load polish delay). */
export function cachedDashboardHasProjectsArray(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const c = JSON.parse(raw) as Record<string, unknown>;
    return Boolean(c && typeof c === "object" && Array.isArray(c.projects));
  } catch {
    return false;
  }
}
