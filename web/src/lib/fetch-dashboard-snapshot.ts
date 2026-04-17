import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "@shared/types/database";
import { buildSpendByCategory } from "@shared/lib/spend-by-category";
import { partialDashboardLoadMessage } from "@shared/lib/dashboard-partial-load";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import type { DashboardSnapshot } from "@shared/types/dashboard-snapshot";


export type { DashboardSnapshot };

const emptySnapshot = (): DashboardSnapshot => ({
  configured: true,
  redirectToLogin: null,
  loadError: null,
  projects: [],
  project: null,
  scopeItems: [],
  invoices: [],
  spendByCategory: {},
  isArchitect: false,
  subscription: null,
  hasProjectPass: false,
  lastProjectId: null,
});



/**
 * Loads dashboard data from Supabase. Pure data fetcher designed to be wrapped
 * by TanStack Query. Side effects (redirects, local storage updates) should be
 * handled in the calling hook.
 */
export async function fetchDashboardSnapshot(options?: {
  currentPath?: string;
  projectId?: string | null;
}): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return { ...emptySnapshot(), configured: false };
  }

  const path =
    options?.currentPath ??
    `${typeof window !== "undefined" ? window.location.pathname : "/dashboard"}${typeof window !== "undefined" ? window.location.search : ""}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      ...emptySnapshot(),
      redirectToLogin: getSafeRedirect(path, "/dashboard"),
    };
  }

  let projectId = options?.projectId ?? null;

  // 1. Resolve projectId (Preference -> Projects List -> LocalStorage)
  if (!projectId) {
    const prefRes = await supabase
      .from("user_preferences")
      .select("last_active_project_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!prefRes.error && prefRes.data?.last_active_project_id) {
      projectId = prefRes.data.last_active_project_id;
    }
  }

  // 2. Load all projects for the user
  const projRes = await supabase
    .from("projects")
    .select(
      "id, name, property_id, estimated_min_total, estimated_max_total, confidence_score, stage, created_at, properties!inner(owner_user_id)",
    )
    .eq("properties.owner_user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (projRes.error) {
    return {
      ...emptySnapshot(),
      loadError: friendlyDashboardLoadError(projRes.error),
    };
  }

  const rows = (projRes.data ?? []) as unknown as ProjectRow[];

  if (rows.length > 0) {
    // If we have a projectId but it's not in our list, fallback to the latest
    if (!projectId || !rows.find((p) => p.id === projectId)) {
      projectId = rows[0].id;
    }

    const project: ProjectRow =
      rows.find((p) => p.id === projectId) ?? rows[0];

    const [scopesRes, invRes, subRes, subRes2] = await Promise.all([
      supabase
        .from("scope_items")
        .select(
          "id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score, source, metadata",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      supabase
        .from("invoices")
        .select(
          "id, vendor_name, total, created_at, payment_status, document_type, document_id",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase
        .from("project_passes")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle(),
    ]);

    const loadErrorPartial = partialDashboardLoadMessage(
      {
        scopeFailed: !!scopesRes.error,
        invoicesFailed: !!invRes.error,
        subscriptionFailed: !!subRes.error,
        projectPassFailed: !!subRes2.error,
      },
      { variant: "web" },
    );

    const newScopes = (scopesRes.data ?? []) as ScopeRow[];
    const newInvoices = (invRes.data ?? []) as InvoiceRow[];
    const sub = subRes.data as UserSubscriptionRow | null;
    const pass = subRes2.data as ProjectPassRow | null;
    const newIsArchitect = isArchitectPlanEffective(sub);
    const newHasProjectPass = !!pass;

    const invoiceIds = newInvoices.map((i) => i.id).filter(Boolean);
    let spendByCategory: Record<string, number> = {};
    if (invoiceIds.length > 0) {
      const linesRes = await supabase
        .from("invoice_line_items")
        .select("category, line_total, scope_item_id")
        .in("invoice_id", invoiceIds);
      if (!linesRes.error) {
        spendByCategory = buildSpendByCategory(linesRes.data ?? [], newScopes);
      }
    }

    return {
      configured: true,
      redirectToLogin: null,
      loadError: loadErrorPartial,
      projects: rows,
      project,
      scopeItems: newScopes,
      invoices: newInvoices,
      spendByCategory,
      isArchitect: newIsArchitect,
      subscription: sub,
      hasProjectPass: newHasProjectPass,
      lastProjectId: projectId,
    };
  }

  return {
    ...emptySnapshot(),
    projects: rows,
    project: null,
    lastProjectId: null,
  };
}

export const dashboardQueryKey = (projectId?: string | null) =>
  ["dashboard", "snapshot", projectId ?? "latest"] as const;
