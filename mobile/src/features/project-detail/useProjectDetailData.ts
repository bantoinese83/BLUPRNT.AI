import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Share } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { generateProjectShareLink } from "@/lib/share-project";
import { friendlyProjectShareError } from "@shared/lib/user-friendly-errors";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import { supabase } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { InvoiceRow, ProjectRow, ScopeRow } from "@shared/types/database";
import { groupScopeByCategory, projectHasEstimateTotals } from "./helpers";

export function useProjectDetailData() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === "string" ? rawId : undefined;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scope, setScope] = useState<ScopeRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailInvoices, setDetailInvoices] = useState<InvoiceRow[]>([]);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const { isArchitect, hasProjectPass, addItem } = useDashboardData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scopePollDone, setScopePollDone] = useState(false);
  const [scopeLoadWarning, setScopeLoadWarning] = useState<string | null>(null);

  const invoiceTotal = useMemo(
    () => detailInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    [detailInvoices],
  );

  const groupedScope = useMemo(() => groupScopeByCategory(scope), [scope]);

  const handleShare = useCallback(async () => {
    if (!project) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await generateProjectShareLink(project.id);
      if (res.ok && res.url) {
        await Share.share({
          message: `Check out my project: ${project.name} on BLUPRNT.AI\n\n${res.url}`,
          url: res.url,
          title: project.name,
        });
      } else {
        Alert.alert(
          "Couldn’t share",
          friendlyProjectShareError(res.message, res.code),
        );
      }
    } catch (err) {
      console.error("Share error:", err);
      Alert.alert(
        "Couldn’t share",
        friendlyProjectShareError(
          err instanceof Error ? err.message : undefined,
        ),
      );
    }
  }, [project]);

  useEffect(() => {
    async function fetchProject() {
      if (!id) return;

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

      if (projRes.data) setProject(projRes.data);
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
      setDetailInvoices((invRes.data ?? []) as InvoiceRow[]);
      setLoading(false);
    }

    void fetchProject();
  }, [id]);

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
        return false;
      }
      if (data?.length) {
        setScope(data);
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

  const handleRefresh = useCallback(async () => {
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
        .from("invoices")
        .select(
          "id, vendor_name, total, created_at, payment_status, document_type, document_id",
        )
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    setScope(scopeRes.data ?? []);
    if (scopeRes.error) {
      console.warn("[project] scope_items refresh", scopeRes.error.message);
      setScopeLoadWarning(
        friendlyDashboardLoadError({
          message: scopeRes.error.message,
          code: scopeRes.error.code,
        }),
      );
    } else {
      setScopeLoadWarning(null);
    }
    setDetailInvoices((invRes.data ?? []) as InvoiceRow[]);
    setLoading(false);
  }, [id]);

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
    loading,
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
    scopeLoadWarning,
    setScopeLoadWarning,
    invoiceTotal,
    groupedScope,
    handleShare,
    handleRefresh,
    exportSellerPacket,
  };
}

export type ProjectDetailViewModel = ReturnType<typeof useProjectDetailData>;
