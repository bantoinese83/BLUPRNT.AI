import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { presentProjectShareSheet } from "@/lib/share-project";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import { supabase } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import { dashboardQueryKey } from "@/lib/query-client";
import type { InvoiceRow, ProjectRow, ScopeRow } from "@shared/types/database";
import { groupScopeByCategory, projectHasEstimateTotals } from "./helpers";
import { capitalImprovementTotal } from "@shared/lib/plan-vs-actual";
import { friendlyPostgrestMutationError } from "@shared/lib/user-friendly-errors";

export function useProjectDetailData() {
  const { id: rawId, focus: rawFocus } = useLocalSearchParams<{
    id: string;
    focus?: string;
  }>();
  const id = typeof rawId === "string" ? rawId : undefined;
  const scrollFocus = rawFocus === "scope" ? "scope" : undefined;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scope, setScope] = useState<ScopeRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailInvoices, setDetailInvoices] = useState<InvoiceRow[]>([]);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const queryClient = useQueryClient();
  const { isArchitect, hasProjectPass, addItem } = useDashboardData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scopePollDone, setScopePollDone] = useState(false);
  const [scopeLoadWarning, setScopeLoadWarning] = useState<string | null>(null);
  const [invoiceLoadWarning, setInvoiceLoadWarning] = useState<string | null>(
    null,
  );

  const detailDataWarning = useMemo(
    () =>
      [scopeLoadWarning, invoiceLoadWarning].filter(Boolean).join("\n\n") ||
      null,
    [scopeLoadWarning, invoiceLoadWarning],
  );

  const clearDetailDataWarnings = useCallback(() => {
    setScopeLoadWarning(null);
    setInvoiceLoadWarning(null);
  }, []);

  /** Capital improvements only — matches home dashboard health & resale inputs. */
  const invoiceTotal = useMemo(
    () => capitalImprovementTotal(detailInvoices),
    [detailInvoices],
  );

  const groupedScope = useMemo(() => groupScopeByCategory(scope), [scope]);

  const ingestFetchResults = useCallback(
    (
      projRes: {
        data: ProjectRow | null;
        error: { message: string; code?: string } | null;
      },
      scopeRes: {
        data: ScopeRow[] | null;
        error: { message: string; code?: string } | null;
      },
      invRes: {
        data: InvoiceRow[] | null;
        error: { message: string; code?: string } | null;
      },
    ) => {
      if (projRes.error) {
        setProjectLoadError(
          friendlyDashboardLoadError({
            message: projRes.error.message,
            code: projRes.error.code,
          }),
        );
        setProject(null);
      } else if (projRes.data) {
        setProject(projRes.data);
        setProjectLoadError(null);
      } else {
        setProject(null);
        setProjectLoadError(
          friendlyDashboardLoadError({
            message: "We couldn’t find this project.",
            code: "PGRST116",
          }),
        );
      }

      setScope(scopeRes.data ?? []);
      if (scopeRes.error) {
        console.warn("[project] scope_items", scopeRes.error.message);
        setScopeLoadWarning(
          friendlyDashboardLoadError({
            message: scopeRes.error.message,
            code: scopeRes.error.code,
          }),
        );
      } else {
        setScopeLoadWarning(null);
      }

      if (invRes.error) {
        console.warn("[project] invoices", invRes.error.message);
        setInvoiceLoadWarning(
          friendlyDashboardLoadError({
            message: invRes.error.message,
            code: invRes.error.code,
          }),
        );
      } else {
        setInvoiceLoadWarning(null);
      }

      setDetailInvoices((invRes.data ?? []) as InvoiceRow[]);
    },
    [],
  );

  const handleShare = useCallback(async () => {
    if (!project) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await presentProjectShareSheet({ id: project.id, name: project.name });
  }, [project]);

  useEffect(() => {
    async function fetchProject() {
      if (!id) {
        setLoading(false);
        setProjectLoadError(null);
        setScopeLoadWarning(null);
        setInvoiceLoadWarning(null);
        return;
      }

      setLoading(true);
      queueMicrotask(() => setScopePollDone(false));

      const [projRes, scopeRes, invRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("scope_items")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("invoices")
          .select(
            "id, vendor_name, total, created_at, payment_status, document_type, document_id",
          )
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
      ]);

      ingestFetchResults(projRes, scopeRes, invRes);
      setLoading(false);
    }

    void fetchProject();
  }, [id, ingestFetchResults]);

  useEffect(() => {
    if (!id || loading) return;

    if (scope.length > 0) {
      queueMicrotask(() => setScopePollDone(true));
      return;
    }

    if (!projectHasEstimateTotals(project)) {
      queueMicrotask(() => setScopePollDone(true));
      return;
    }

    queueMicrotask(() => setScopePollDone(false));
    let attempts = 0;
    const maxAttempts = 8;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchScopeOnly = async () => {
      const { data, error } = await supabase
        .from("scope_items")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      if (cancelled) return false;
      if (error) {
        console.warn("[project] scope_items poll", error.message);
        setScopeLoadWarning(
          friendlyDashboardLoadError({
            message: error.message,
            code: error.code,
          }),
        );
        return false;
      }
      if (data?.length) {
        setScope(data);
        setScopeLoadWarning(null);
        return true;
      }
      return false;
    };

    const finish = () => {
      if (interval) clearInterval(interval);
      interval = null;
      if (!cancelled) setScopePollDone(true);
    };

    void (async () => {
      const immediate = await fetchScopeOnly();
      if (immediate || cancelled) {
        if (immediate) finish();
        else if (!cancelled) queueMicrotask(() => setScopePollDone(true));
        return;
      }
      interval = setInterval(async () => {
        attempts += 1;
        const done = await fetchScopeOnly();
        if (done || attempts >= maxAttempts) finish();
      }, 2500);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see original screen
  }, [
    id,
    loading,
    project?.estimated_min_total,
    project?.estimated_max_total,
    scope.length,
  ]);

  const updateScopeItemMaterials = useCallback(
    async (
      scopeItemId: string,
      materials: NonNullable<ScopeRow["metadata"]>["materials"],
    ) => {
      const row = scope.find((s) => s.id === scopeItemId);
      if (!row || !id) return;

      const base =
        row.metadata && typeof row.metadata === "object"
          ? { ...row.metadata }
          : {};
      const nextMetadata: ScopeRow["metadata"] = {
        ...base,
        materials: materials ?? [],
      };

      const { error } = await supabase
        .from("scope_items")
        .update({ metadata: nextMetadata })
        .eq("id", scopeItemId);

      if (error) {
        Alert.alert(
          "Couldn't update list",
          friendlyPostgrestMutationError(error),
        );
        return;
      }

      setScope((prev) =>
        prev.map((s) =>
          s.id === scopeItemId ? { ...s, metadata: nextMetadata } : s,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    [scope, id, queryClient],
  );

  const handleRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    setScopePollDone(false);
    const [projRes, scopeRes, invRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("scope_items")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("invoices")
        .select(
          "id, vendor_name, total, created_at, payment_status, document_type, document_id",
        )
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    ingestFetchResults(projRes, scopeRes, invRes);
    setRefreshing(false);
  }, [id, ingestFetchResults]);

  const exportSellerPacket = useCallback(async () => {
    if (!project || !id) return;
    if (!isArchitect && !hasProjectPass) {
      setShowUpgrade(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const scopeForPdf = scope.map((s) => ({
        category: s.category,
        description: s.description,
        total_cost_min: s.total_cost_min,
        total_cost_max: s.total_cost_max,
      }));
      await generateSellerPacketPDF(
        {
          id: project.id,
          property_id: project.property_id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeForPdf,
        detailInvoices,
        { includeAppendix },
      );
    } catch {
      Alert.alert(
        "Export Failed",
        "We couldn’t generate the PDF. Check your connection and try again.",
      );
    }
  }, [
    project,
    id,
    isArchitect,
    hasProjectPass,
    scope,
    detailInvoices,
    includeAppendix,
  ]);

  return {
    id,
    scrollFocus,
    loading,
    refreshing,
    projectLoadError,
    project,
    scope,
    expandedId,
    setExpandedId,
    detailInvoices,
    includeAppendix,
    setIncludeAppendix,
    isArchitect,
    hasProjectPass,
    addItem,
    showUpgrade,
    setShowUpgrade,
    showAddModal,
    setShowAddModal,
    scopePollDone,
    detailDataWarning,
    clearDetailDataWarnings,
    invoiceTotal,
    groupedScope,
    handleShare,
    handleRefresh,
    exportSellerPacket,
    updateScopeItemMaterials,
  };
}

export type ProjectDetailViewModel = ReturnType<typeof useProjectDetailData>;
