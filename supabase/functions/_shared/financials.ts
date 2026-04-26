import { SupabaseClient } from "@supabase/supabase-js";

export interface BudgetHealth {
  projectId: string;
  estimatedMin: number;
  estimatedMax: number;
  actualTotal: number;
  percentOfMax: number;
  isOverBudget: boolean;
  isNearingBudget: boolean;
}

/**
 * Calculates the current financial health of a project.
 */
export async function getProjectBudgetHealth(
  supabase: SupabaseClient,
  projectId: string
): Promise<BudgetHealth | null> {
  const [projRes, invRes] = await Promise.all([
    supabase
      .from("projects")
      .select("estimated_min_total, estimated_max_total")
      .eq("id", projectId)
      .single(),
    supabase
      .from("invoices")
      .select("total")
      .eq("project_id", projectId)
  ]);

  if (projRes.error || !projRes.data) return null;

  const estimatedMin = Number(projRes.data.estimated_min_total || 0);
  const estimatedMax = Number(projRes.data.estimated_max_total || 0);
  const actualTotal = (invRes.data || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const percentOfMax = estimatedMax > 0 ? (actualTotal / estimatedMax) * 100 : 0;

  return {
    projectId,
    estimatedMin,
    estimatedMax,
    actualTotal,
    percentOfMax,
    isOverBudget: estimatedMax > 0 && actualTotal > estimatedMax,
    isNearingBudget: estimatedMax > 0 && percentOfMax >= 85 && actualTotal <= estimatedMax,
  };
}
