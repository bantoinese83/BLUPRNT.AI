import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryWithLines,
  UserSubscriptionRow,
  GalleryItemRow,
} from "./database.ts";

import type { ReconciliationResult } from "../lib/reconciliation.ts";

/** Per-project visuals for the horizontal project switcher (cover path + ledger size). */
export type ProjectSwitcherHint = {
  coverStoragePath: string | null;
  documentCount: number;
};

export type ProjectSwitcherHints = Record<string, ProjectSwitcherHint>;

/** Dashboard bundle used by web and mobile data layers. */
export type DashboardSnapshot = {
  configured: boolean;
  /** Web: when set, client redirects to login with this `returnTo` path. */
  redirectToLogin: string | null;
  loadError: string | null;
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryWithLines[];
  spendByCategory: Record<string, number>;
  reconciliation: ReconciliationResult | null;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  galleryItems: GalleryItemRow[];
  lastProjectId: string | null;
  /** Keys are `project_id`; used by mobile project cards (thumbnails, doc counts). */
  projectSwitcherHints: ProjectSwitcherHints;
};
