import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "./supabase";
import { friendlyDashboardLoadError } from "./dashboard-load-error";
import type { DashboardSnapshot } from "../types/dashboard-snapshot";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "../../../shared/types/database";

const emptySnapshot = (): DashboardSnapshot => ({
  configured: true,
  redirectToLogin: null,
  loadError: null,
  projects: [],
  project: null,
  scopeItems: [],
  invoices: [],
  isArchitect: false,
  subscription: null,
  hasProjectPass: false,
  lastProjectId: null,
});

export async function fetchMobileDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return { ...emptySnapshot(), configured: false };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return emptySnapshot();
  }

  const cacheKey = `bluprnt_dash_${session.user.id}`;

  let projectId = await AsyncStorage.getItem("bluprnt_project_id");

  const prefRes = await supabase
    .from("user_preferences")
    .select("last_active_project_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!prefRes.error && prefRes.data?.last_active_project_id) {
    projectId = prefRes.data.last_active_project_id;
  }

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
    if (!projectId) {
      projectId = rows[0].id;
      await AsyncStorage.setItem("bluprnt_project_id", projectId as string);
    }

    let project: ProjectRow | null =
      rows.find((p) => p.id === projectId) ?? null;
    if (!project) {
      projectId = rows[0].id;
      project = rows[0];
      await AsyncStorage.setItem("bluprnt_project_id", projectId as string);
    }

    if (!projectId) {
      return {
        ...emptySnapshot(),
        projects: rows,
        project: null,
        lastProjectId: null,
      };
    }

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

    const detailErr =
      scopesRes.error || invRes.error || subRes.error || subRes2.error;
    const loadErrorPartial = detailErr
      ? "Some details couldn’t load. Your summary may be incomplete — pull to refresh."
      : null;

    const newScopes = (scopesRes.data ?? []) as ScopeRow[];
    const newInvoices = (invRes.data ?? []) as InvoiceRow[];
    const sub = subRes.data as UserSubscriptionRow | null;
    const pass = subRes2.data as ProjectPassRow | null;
    const newIsArchitect = sub?.status === "active";
    const newHasProjectPass = !!pass;

    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        projects: rows,
        project: rows.find((p) => p.id === projectId) ?? rows[0] ?? null,
        scopeItems: newScopes,
        invoices: newInvoices,
        isArchitect: newIsArchitect,
        subscription: sub,
        hasProjectPass: newHasProjectPass,
      }),
    );

    return {
      configured: true,
      redirectToLogin: null,
      loadError: loadErrorPartial,
      projects: rows,
      project,
      scopeItems: newScopes,
      invoices: newInvoices,
      isArchitect: newIsArchitect,
      subscription: sub,
      hasProjectPass: newHasProjectPass,
      lastProjectId: projectId,
    };
  }

  await AsyncStorage.removeItem(cacheKey);

  return {
    ...emptySnapshot(),
    projects: rows,
    project: null,
    lastProjectId: null,
  };
}
