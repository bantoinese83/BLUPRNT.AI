import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
  UserSubscriptionRow,
  GalleryItemRow,
} from "../types/database.ts";
import type { ProjectSwitcherHints } from "../types/dashboard-snapshot.ts";

/** Shape stored in sessionStorage (web) / AsyncStorage (mobile) after a successful dashboard load. */
export type CachedDashboardPayload = {
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryRow[];
  spendByCategory: Record<string, number>;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  galleryItems?: GalleryItemRow[];
  reconciliation: import("../lib/reconciliation").ReconciliationResult | null;
  projectSwitcherHints?: ProjectSwitcherHints;
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
      ledgerEntries: Array.isArray(o.ledgerEntries)
        ? o.ledgerEntries
        : Array.isArray((o as Record<string, unknown>).invoices)
          ? ((o as Record<string, unknown>).invoices as LedgerEntryRow[])
          : [],
      galleryItems: Array.isArray(o.galleryItems) ? o.galleryItems : [],
      reconciliation: o.reconciliation ?? null,
      spendByCategory:
        o.spendByCategory && typeof o.spendByCategory === "object"
          ? o.spendByCategory
          : {},
      isArchitect: Boolean(o.isArchitect),
      subscription: o.subscription ?? null,
      hasProjectPass: Boolean(o.hasProjectPass),
      projectSwitcherHints:
        o.projectSwitcherHints &&
        typeof o.projectSwitcherHints === "object" &&
        !Array.isArray(o.projectSwitcherHints)
          ? (o.projectSwitcherHints as ProjectSwitcherHints)
          : undefined,
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
