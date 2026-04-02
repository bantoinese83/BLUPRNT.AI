import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "../types/database";

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
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

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const cacheKey = `bluprnt_dash_${session.user.id}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const c = JSON.parse(cachedData);
        if (c.projects) setProjects(c.projects);
        if (c.project) setProject(c.project);
        if (c.scopeItems) setScopeItems(c.scopeItems);
        if (c.invoices) setInvoices(c.invoices);
        if (c.isArchitect !== undefined) setIsArchitect(c.isArchitect);
        if (c.subscription !== undefined) setSubscription(c.subscription);
        if (c.hasProjectPass !== undefined) setHasProjectPass(c.hasProjectPass);
      } catch {
        /* ignore */
      }
    }

    // P3B: Prefer DB-synced active project (cross-platform) over local storage.
    // This ensures web→mobile context is preserved.
    let projectId = await AsyncStorage.getItem("bluprnt_project_id");

    // Try to fetch the DB-stored preference first (cross-platform sync).
    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("last_active_project_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (prefData?.last_active_project_id) {
      projectId = prefData.last_active_project_id;
    }

    const { data: allProjects } = await supabase
      .from("projects")
      .select(
        "id, name, property_id, estimated_min_total, estimated_max_total, confidence_score, stage, properties!inner(owner_user_id)",
      )
      .eq("properties.owner_user_id", session.user.id)
      .order("created_at", { ascending: false });

    const rows = (allProjects ?? []) as ProjectRow[];
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
            "id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score",
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
    setLoading(false);
  }, []);

  useEffect(() => {
    // Create a version of load that respects the closure
    const runLoad = async () => {
      await load();
    };

    runLoad();
  }, [load]);

  const handleProjectSelect = useCallback(
    async (id: string) => {
      // Write to local storage for fast offline access.
      await AsyncStorage.setItem("bluprnt_project_id", id);

      // Write to DB for cross-platform sync (web will pick this up on next load).
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

  // Delegates to the authoritative DB function — prevents logic drift vs. web.
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
      phase: newItem.phase,
      quantity: newItem.quantity,
      unit: newItem.unit,
      finish_tier: "mid",
      unit_cost_min: newItem.cost,
      unit_cost_max: newItem.cost,
      total_cost_min: newItem.cost * newItem.quantity,
      total_cost_max: newItem.cost * newItem.quantity,
    });

    if (err) throw err;

    await recalcProjectTotals(pid);
    load(); // Refresh local data
  };

  return {
    loading,
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
