import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import { projectHasEstimateTotals } from "../helpers";
import type { ProjectRow, ScopeRow } from "@shared/types/database";

interface UseProjectPollingProps {
  id?: string;
  loading: boolean;
  project: ProjectRow | null;
  scopeCount: number;
  setScope: (scope: ScopeRow[]) => void;
  setScopeLoadWarning: (warning: string | null) => void;
  setScopePollDone: (done: boolean) => void;
  onScopeArrived?: (newScopes: ScopeRow[]) => void;
}

export function useProjectPolling({
  id,
  loading,
  project,
  scopeCount,
  setScope,
  setScopeLoadWarning,
  setScopePollDone,
  onScopeArrived,
}: UseProjectPollingProps) {
  useEffect(() => {
    if (!id || loading) return;

    if (scopeCount > 0) {
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
        const newScopes = data as ScopeRow[];
        setScope(newScopes);
        setScopeLoadWarning(null);
        if (onScopeArrived) onScopeArrived(newScopes);
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
  }, [
    id,
    loading,
    project,
    scopeCount,
    setScope,
    setScopeLoadWarning,
    setScopePollDone,
    onScopeArrived,
  ]);
}
