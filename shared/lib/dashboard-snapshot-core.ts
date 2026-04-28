/**
 * Shared Supabase queries and aggregation for dashboard snapshots (web + mobile).
 * Platform code owns auth redirects, localStorage / AsyncStorage, and cache policies.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
  UserSubscriptionRow,
  ProjectPassRow,
  GalleryItemRow,
} from "../types/database.ts";
import type { DashboardSnapshot } from "../types/dashboard-snapshot.ts";
import { buildSpendByCategory } from "./spend-by-category.ts";
import { partialDashboardLoadMessage } from "./dashboard-partial-load.ts";
import { isArchitectPlanEffective } from "./architect-entitlement.ts";
import {
  buildReconciliation,
  type ReconciliationResult,
} from "./reconciliation.ts";

export function emptyDashboardSnapshot(): DashboardSnapshot {
  return {
    configured: true,
    redirectToLogin: null,
    loadError: null,
    projects: [],
    project: null,
    scopeItems: [],
    ledgerEntries: [],
    spendByCategory: {},
    reconciliation: null,
    isArchitect: false,
    subscription: null,
    hasProjectPass: false,
    galleryItems: [],
    lastProjectId: null,
  };
}

const PROJECTS_LIST_SELECT =
  "id, name, property_id, estimated_min_total, estimated_max_total, confidence_score, stage, created_at";

const SCOPE_SELECT =
  "id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score, source, metadata, justification, maintenance_tips, priority, phase";

const LEDGER_SELECT =
  "id, vendor_name, total, created_at, payment_status, document_type, document_id, issue_date, project_id, vendor_contact_info, warranty_expiry_date, ai_summary";

const LEDGER_WITH_LINES_SELECT = `${LEDGER_SELECT}, ledger_line_items(ledger_entry_id, category, line_total, scope_item_id)`;

const GALLERY_SELECT =
  "id, project_id, photo_type, storage_path, caption, uploaded_by_user_id, created_at";

/**
 * All projects the user owns.
 */
export async function fetchDashboardProjectsList(
  supabase: SupabaseClient,
  _userId: string,
): Promise<{ rows: ProjectRow[]; error: PostgrestError | null }> {
  const projRes = await supabase
    .from("projects")
    .select(PROJECTS_LIST_SELECT)
    .order("created_at", { ascending: false });
  if (projRes.error) {
    return { rows: [], error: projRes.error };
  }
  return {
    rows: (projRes.data ?? []) as unknown as ProjectRow[],
    error: null,
  };
}

export async function fetchLastActiveProjectIdFromPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const prefRes = await supabase
    .from("user_preferences")
    .select("last_active_project_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!prefRes.error && prefRes.data?.last_active_project_id) {
    return prefRes.data.last_active_project_id;
  }
  return null;
}

export type BuiltDashboardForProject = {
  project: ProjectRow;
  scopeItems: import("../types/database.ts").ScopeRow[];
  ledgerEntries: import("../types/database.ts").LedgerEntryRow[];
  galleryItems: import("../types/database.ts").GalleryItemRow[];
  spendByCategory: Record<string, number>;
  reconciliation: ReconciliationResult | null;
  loadError: string | null;
  isArchitect: boolean;
  subscription: import("../types/database.ts").UserSubscriptionRow | null;
  hasProjectPass: boolean;
  lastProjectId: string;
};

/**
 * Loads scope, ledger entries, subscription, pass, and spend-by-category for a project.
 * Callers must only pass a `projectId` that exists in `allProjects` (when non-empty).
 */
export async function buildDashboardDataForProject(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectId: string;
    allProjects: ProjectRow[];
    partialMessageVariant: "web" | "mobile";
  },
): Promise<BuiltDashboardForProject> {
  const { userId, projectId, allProjects, partialMessageVariant } = input;

  const [scopesRes, invRes, subRes, subRes2, galleryRes] = await Promise.all([
    supabase
      .from("scope_items")
      .select(SCOPE_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("ledger_entries")
      .select(LEDGER_WITH_LINES_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("project_passes")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("project_gallery")
      .select(GALLERY_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  const loadError = partialDashboardLoadMessage(
    {
      scopeFailed: !!scopesRes.error,
      ledgerEntriesFailed: !!invRes.error,
      subscriptionFailed: !!subRes.error,
      projectPassFailed: !!subRes2.error,
      galleryFailed: !!galleryRes.error,
    },
    { variant: partialMessageVariant },
  );

  const newScopes = (scopesRes.data ?? []) as ScopeRow[];
  const newLedgerRaw = (invRes.data ?? []) as (LedgerEntryRow & {
    ledger_line_items?: import("../types/database.ts").LedgerLineItemRow[];
  })[];
  const newLedger = newLedgerRaw as LedgerEntryRow[];
  const newGalleryItems = (galleryRes.data ?? []) as GalleryItemRow[];
  const sub = subRes.data as UserSubscriptionRow | null;
  const pass = subRes2.data as ProjectPassRow | null;
  const isArchitect = isArchitectPlanEffective(sub);
  const hasProjectPass = !!pass;

  const allLineItems = newLedgerRaw.flatMap((l) => {
    const lines = l.ledger_line_items || [];
    if (lines.length === 0 && (l.total || 0) > 0) {
      // Fallback: If no line items but we have a total, create a single representative line item
      // so it counts towards spendByCategory and reconciliation.
      return [
        {
          ledger_entry_id: l.id,
          category: null,
          line_total: l.total,
          scope_item_id: null,
          is_verified: l.is_verified,
          description: l.ai_summary || l.vendor_name || "Document Total",
          quantity: 1,
          unit_price: l.total,
        } as any,
      ];
    }
    return lines.map((li) => ({
      ...li,
      is_verified: l.is_verified,
    }));
  });
  const spendByCategory = buildSpendByCategory(allLineItems, newScopes);
  const reconciliation = buildReconciliation(newScopes, allLineItems);

  const project =
    allProjects.find((p) => p.id === projectId) ??
    (allProjects[0] as ProjectRow);

  return {
    project,
    scopeItems: newScopes,
    ledgerEntries: newLedger,
    galleryItems: newGalleryItems,
    spendByCategory,
    reconciliation,
    loadError,
    isArchitect,
    subscription: sub,
    hasProjectPass,
    lastProjectId: projectId,
  };
}
