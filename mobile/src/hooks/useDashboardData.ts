import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { friendlyDashboardLoadError } from "../lib/dashboard-load-error";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "../types/database";

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [configurationMissing, setConfigurationMissing] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isArchitect, setIsArchitect] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscriptionRow | null>(
    null,
  );
  const [hasProjectPass, setHasProjectPass] = useState(false);
  const lastFetchedProjectId = useRef<string | null>(null);

  const clearLoadError = useCallback(() => setLoadError(null), []);

  const load = useCallback(async () => {
    setLoadError(null);

    if (!isSupabaseConfigured()) {
      setConfigurationMissing(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setConfigurationMissing(false);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cacheKey = `bluprnt_dash_${session.user.id}`;
    const cachedRaw = await AsyncStorage.getItem(cacheKey);
    let hadCache = false;
    if (cachedRaw) {
      try {
        const c = JSON.parse(cachedRaw) as Record<string, unknown>;
        if (c && typeof c === "object" && Array.isArray(c.projects)) {
          hadCache = true;
          setProjects(c.projects as ProjectRow[]);
          if (c.project) setProject(c.project as ProjectRow);
          if (c.scopeItems) setScopeItems(c.scopeItems as ScopeRow[]);
          if (c.invoices) setInvoices(c.invoices as InvoiceRow[]);
          if (c.isArchitect !== undefined)
            setIsArchitect(Boolean(c.isArchitect));
          if (c.subscription !== undefined)
            setSubscription(c.subscription as UserSubscriptionRow | null);
          if (c.hasProjectPass !== undefined)
            setHasProjectPass(Boolean(c.hasProjectPass));
          setLoading(false);
          setRefreshing(true);
        }
      } catch {
        /* ignore */
      }
    }

    if (!hadCache) {
      setLoading(true);
      setRefreshing(false);
    }

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
      setLoadError(friendlyDashboardLoadError(projRes.error));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rows = (projRes.data ?? []) as ProjectRow[];
    setProjects(rows);

    if (rows.length > 0) {
      if (!projectId) {
        projectId = rows[0].id;
        await AsyncStorage.setItem("bluprnt_project_id", projectId);
      }

      const proj = rows.find((p) => p.id === projectId) ?? null;
      if (proj) {
        setProject(proj);
      } else {
        projectId = rows[0].id;
        setProject(rows[0]);
        await AsyncStorage.setItem("bluprnt_project_id", projectId);
      }
    } else {
      setProject(null);
      projectId = null;
    }

    if (projectId) {
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
            "id, vendor_name, total, created_at, payment_status, document_type",
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
      if (detailErr) {
        setLoadError(
          "Some details couldn’t load. Your summary may be incomplete — pull to refresh.",
        );
      }

      const newScopes = (scopesRes.data ?? []) as ScopeRow[];
      const newInvoices = (invRes.data ?? []) as InvoiceRow[];
      const sub = subRes.data as UserSubscriptionRow | null;
      const pass = subRes2.data as ProjectPassRow | null;

      const newIsArchitect = sub?.status === "active";
      const newHasProjectPass = !!pass;

      setScopeItems(newScopes);
      setInvoices(newInvoices);
      setIsArchitect(newIsArchitect);
      setSubscription(sub);
      setHasProjectPass(newHasProjectPass);

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
    } else {
      await AsyncStorage.removeItem(cacheKey);
    }

    lastFetchedProjectId.current = projectId;
    setRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    const runLoad = async () => {
      await load();
    };
    runLoad();
  }, [load]);

  const handleProjectSelect = useCallback(
    async (id: string) => {
      await AsyncStorage.setItem("bluprnt_project_id", id);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("user_preferences").upsert({
          user_id: session.user.id,
          last_active_project_id: id,
          updated_at: new Date().toISOString(),
        });
      }

      load();
    },
    [load],
  );

  const recalcProjectTotals = async (pid: string) => {
    await supabase.rpc("recalc_project_totals", { p_id: pid });
  };

  const addItem = async (
    pid: string,
    newItem: {
      category: string;
      description: string;
      phase: string;
      cost: number;
      quantity: number;
      unit: string;
    },
  ) => {
    const { error: err } = await supabase.from("scope_items").insert({
      project_id: pid,
      category: newItem.category,
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit,
      finish_tier: "mid",
      unit_cost_min: newItem.cost,
      unit_cost_max: newItem.cost,
      total_cost_min: newItem.cost * newItem.quantity,
      total_cost_max: newItem.cost * newItem.quantity,
      metadata: { phase: newItem.phase, priority: "medium" },
    });

    if (err) throw err;

    await recalcProjectTotals(pid);
    load();
  };

  return {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    configurationMissing,
    projects,
    project,
    scopeItems,
    invoices,
    isArchitect,
    subscription,
    hasProjectPass,
    load,
    handleProjectSelect,
    addItem,
    recalcProjectTotals,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
  };
}
