import type { SupabaseClient } from "@supabase/supabase-js";

export type NewScopeItem = {
  category: string;
  description: string;
  phase: string;
  cost: number;
  quantity: number;
  unit: string;
};

/**
 * Shared logic to add a scope item and recalculate project totals.
 */
export async function addScopeItem(
  supabase: SupabaseClient,
  projectId: string,
  newItem: NewScopeItem,
) {
  const { error: err } = await supabase.from("scope_items").insert({
    project_id: projectId,
    category: newItem.category,
    description: newItem.description || "",
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

  await recalcProjectTotals(supabase, projectId);
}

/**
 * Shared logic to recalculate project totals via RPC.
 */
export async function recalcProjectTotals(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { error } = await supabase.rpc("recalc_project_totals", {
    p_id: projectId,
  });
  if (error) throw error;
}
