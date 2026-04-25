import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { presentProjectShareSheet } from "@/lib/share-project";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import { supabase } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { InvoiceRow, ProjectRow, ScopeRow } from "@shared/types/database";
import { groupScopeByCategory } from "./helpers";
import { capitalImprovementTotal } from "@shared/lib/plan-vs-actual";
import {
  buildReconciliation,
  type ReconciliationResult,
} from "@shared/lib/reconciliation";
import { buildSpendByCategory } from "@shared/lib/spend-by-category";

// Sub-hooks
import { useProjectPolling } from "./hooks/useProjectPolling";
import { useProjectMutations } from "./hooks/useProjectMutations";
import { useProjectExport } from "./hooks/useProjectExport";

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

  const {
    isArchitect,
    hasProjectPass,
    addItem,
    projects,
    handleProjectSelect,
    galleryItems,
  } = useDashboardData();

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

  const invoiceTotal = useMemo(
    () => capitalImprovementTotal(detailInvoices),
    [detailInvoices],
  );

  const [reconciliation, setReconciliation] =
    useState<ReconciliationResult | null>(null);
  const [spendByCategory, setSpendByCategory] = useState<
    Record<string, number>
  >({});

  const groupedScope = useMemo(() => groupScopeByCategory(scope), [scope]);

  const refreshReconciliation = useCallback(
    async (currentScope: ScopeRow[], currentInvoices: InvoiceRow[]) => {
      if (currentInvoices.length === 0) return;

      const { data: lines } = await supabase
        .from("invoice_line_items")
        .select("invoice_id, line_total, scope_item_id, category")
        .in(
          "invoice_id",
          currentInvoices.map((i) => i.id),
        );

      if (lines) {
        setReconciliation(buildReconciliation(currentScope, lines));
        setSpendByCategory(
          buildSpendByCategory(
            lines.map((l) => ({
              category: l.category,
              line_total: l.line_total,
              scope_item_id: l.scope_item_id,
            })),
            currentScope,
          ),
        );
      }
    },
    [],
  );

  const ingestFetchResults = useCallback(
    async (
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
        setProject(projRes.data as unknown as ProjectRow);
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

      const newScopes = (scopeRes.data ?? []) as ScopeRow[];
      setScope(newScopes);
      if (scopeRes.error) {
        setScopeLoadWarning(
          friendlyDashboardLoadError({
            message: scopeRes.error.message,
            code: scopeRes.error.code,
          }),
        );
      } else {
        setScopeLoadWarning(null);
      }

      const newInvoices = (invRes.data ?? []) as unknown as InvoiceRow[];
      setDetailInvoices(newInvoices);
      if (invRes.error) {
        setInvoiceLoadWarning(
          friendlyDashboardLoadError({
            message: invRes.error.message,
            code: invRes.error.code,
          }),
        );
      } else {
        setInvoiceLoadWarning(null);
      }

      await refreshReconciliation(newScopes, newInvoices);
    },
    [refreshReconciliation],
  );

  const handleShare = useCallback(async () => {
    if (!project) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await presentProjectShareSheet({ id: project.id, name: project.name });
  }, [project]);

  // Initial Fetch
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
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
      ]);

      await ingestFetchResults(
        projRes as unknown as Parameters<typeof ingestFetchResults>[0],
        scopeRes as unknown as Parameters<typeof ingestFetchResults>[1],
        invRes as unknown as Parameters<typeof ingestFetchResults>[2],
      );

      setLoading(false);
    }

    void fetchProject();
  }, [id, ingestFetchResults]);

  // Hook 1: Polling
  useProjectPolling({
    id,
    loading,
    project,
    scopeCount: scope.length,
    setScope,
    setScopeLoadWarning,
    setScopePollDone,
    onScopeArrived: (newScopes) =>
      refreshReconciliation(newScopes, detailInvoices),
  });

  // Hook 2: Mutations
  const { updateScopeItemMaterials } = useProjectMutations({
    id,
    scope,
    setScope,
  });

  // Hook 3: Export
  const { exportSellerPacket } = useProjectExport({
    id,
    project,
    scope,
    detailInvoices,
    isArchitect,
    hasProjectPass,
    includeAppendix,
    setShowUpgrade,
  });

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
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    await ingestFetchResults(
      projRes as unknown as Parameters<typeof ingestFetchResults>[0],
      scopeRes as unknown as Parameters<typeof ingestFetchResults>[1],
      invRes as unknown as Parameters<typeof ingestFetchResults>[2],
    );

    setRefreshing(false);
  }, [id, ingestFetchResults]);

  return {
    id,
    scrollFocus,
    loading,
    refreshing,
    projectLoadError,
    project,
    projects,
    handleProjectSelect,
    scope,
    expandedId,
    setExpandedId,
    detailInvoices,
    reconciliation,
    includeAppendix,
    setIncludeAppendix,
    isArchitect,
    hasProjectPass,
    spendByCategory,
    galleryItems,
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
