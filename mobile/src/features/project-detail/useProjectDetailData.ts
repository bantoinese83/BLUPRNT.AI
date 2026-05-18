import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { presentProjectShareSheet } from "@/lib/share-project";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import { supabase } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useEffectiveEntitlements } from "@/hooks/useEffectiveEntitlements";
import type {
  LedgerEntryRow,
  LedgerLineItemRow,
  ProjectRow,
  ScopeRow,
} from "@shared/types/database";
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
  const [detailLedgerEntries, setDetailLedgerEntries] = useState<
    LedgerEntryRow[]
  >([]);
  const [includeAppendix, setIncludeAppendix] = useState(false);

  const {
    addItem,
    projects,
    projectSwitcherHints,
    handleProjectSelect,
    galleryItems,
  } = useDashboardData();

  const { isArchitect, hasProjectPass } = useEffectiveEntitlements();

  useEffect(() => {
    if (!id) return;
    void handleProjectSelect(id);
  }, [id, handleProjectSelect]);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scopePollDone, setScopePollDone] = useState(false);
  const [scopeLoadWarning, setScopeLoadWarning] = useState<string | null>(null);
  const [ledgerEntryLoadWarning, setLedgerEntryLoadWarning] = useState<
    string | null
  >(null);

  const detailDataWarning = useMemo(
    () =>
      [scopeLoadWarning, ledgerEntryLoadWarning].filter(Boolean).join("\n\n") ||
      null,
    [scopeLoadWarning, ledgerEntryLoadWarning],
  );

  const clearDetailDataWarnings = useCallback(() => {
    setScopeLoadWarning(null);
    setLedgerEntryLoadWarning(null);
  }, []);

  const ledgerEntryTotal = useMemo(
    () => capitalImprovementTotal(detailLedgerEntries),
    [detailLedgerEntries],
  );

  const [reconciliation, setReconciliation] =
    useState<ReconciliationResult | null>(null);
  const [spendByCategory, setSpendByCategory] = useState<
    Record<string, number>
  >({});

  const groupedScope = useMemo(() => groupScopeByCategory(scope), [scope]);

  const updateReconciliationSync = useCallback(
    (currentScope: ScopeRow[], lines: LedgerLineItemRow[]) => {
      if (lines.length === 0) return;

      setReconciliation(
        buildReconciliation(
          currentScope,
          lines as unknown as Array<{
            ledger_entry_id: string;
            line_total: number;
            scope_item_id: string | null;
            category: string | null;
          }>,
        ),
      );
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
        data: Array<
          LedgerEntryRow & { ledger_line_items: LedgerLineItemRow[] }
        > | null;
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

      const newScopes = scopeRes.data ?? [];
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

      const newLedgerEntriesRaw = invRes.data ?? [];
      setDetailLedgerEntries(newLedgerEntriesRaw);

      if (invRes.error) {
        setLedgerEntryLoadWarning(
          friendlyDashboardLoadError({
            message: invRes.error.message,
            code: invRes.error.code,
          }),
        );
      } else {
        setLedgerEntryLoadWarning(null);
      }

      const allLineItems = newLedgerEntriesRaw.flatMap(
        (l) => l.ledger_line_items || [],
      );
      updateReconciliationSync(newScopes, allLineItems);
    },
    [updateReconciliationSync],
  );

  const handleShare = useCallback(async () => {
    if (!project) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await presentProjectShareSheet({ id: project.id, name: project.name });
  }, [project]);

  const handleScopeArrived = useCallback(
    async (newScopes: ScopeRow[]) => {
      const { data: lines } = await supabase
        .from("ledger_line_items")
        .select("ledger_entry_id, category, line_total, scope_item_id")
        .in(
          "ledger_entry_id",
          detailLedgerEntries.map((i) => i.id),
        );
      updateReconciliationSync(newScopes, (lines ?? []) as LedgerLineItemRow[]);
    },
    [detailLedgerEntries, updateReconciliationSync],
  );

  // Hook 1: Polling
  useProjectPolling({
    id,
    loading,
    project,
    scopeCount: scope.length,
    setScope,
    setScopeLoadWarning,
    setScopePollDone,
    onScopeArrived: handleScopeArrived,
  });

  // Hook 2: Mutations
  const { updateScopeItemMaterials } = useProjectMutations({
    id,
    scope,
    setScope,
  });

  // Hook 3: Export
  const { exportSellerPacket, exporting } = useProjectExport({
    id,
    project,
    scope,
    detailLedgerEntries: detailLedgerEntries,
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
        .from("ledger_entries")
        .select("*, ledger_line_items(*)")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    await ingestFetchResults(
      projRes as {
        data: ProjectRow | null;
        error: { message: string; code?: string } | null;
      },
      scopeRes as {
        data: ScopeRow[] | null;
        error: { message: string; code?: string } | null;
      },
      invRes as {
        data: Array<
          LedgerEntryRow & { ledger_line_items: LedgerLineItemRow[] }
        > | null;
        error: { message: string; code?: string } | null;
      },
    );
    setRefreshing(false);
  }, [id, ingestFetchResults]);

  useEffect(() => {
    let cancelled = false;

    const fetchProject = async () => {
      if (!id) return;
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
          .from("ledger_entries")
          .select("*, ledger_line_items(*)")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      await ingestFetchResults(
        projRes as {
          data: ProjectRow | null;
          error: { message: string; code?: string } | null;
        },
        scopeRes as {
          data: ScopeRow[] | null;
          error: { message: string; code?: string } | null;
        },
        invRes as {
          data: Array<
            LedgerEntryRow & { ledger_line_items: LedgerLineItemRow[] }
          > | null;
          error: { message: string; code?: string } | null;
        },
      );
      setLoading(false);
    };

    void fetchProject();

    return () => {
      cancelled = true;
    };
  }, [id, ingestFetchResults]);

  return {
    id,
    scrollFocus,
    loading,
    refreshing,
    projectLoadError,
    project,
    projects,
    projectSwitcherHints,
    handleProjectSelect,
    scope,
    expandedId,
    setExpandedId,
    detailLedgerEntries,
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
    ledgerTotal: ledgerEntryTotal,
    groupedScope,
    handleShare,
    handleRefresh,
    exportSellerPacket,
    exporting,
    updateScopeItemMaterials,
  };
}

export type ProjectDetailViewModel = ReturnType<typeof useProjectDetailData>;
