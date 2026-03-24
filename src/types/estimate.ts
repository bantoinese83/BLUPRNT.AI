export type EstimateSummary = {
  estimated_min_total: number;
  estimated_max_total: number;
  confidence_score: number;
  value_engineering_tips?: string[];
  regional_context?: string;
  regional_signal?: string; // e.g., "Matched to 2026 Material Costs in Austin"
};

export type ScopeItemPreview = {
  id: string;
  category: string;
  description: string;
  finish_tier: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost_min: number | null;
  unit_cost_max: number | null;
  total_cost_min: number | null;
  total_cost_max: number | null;
  confidence_score: number | null;
  confidence_reason?: string; // e.g., "Estimated as mid-range hardwood"
  source: string;
  justification?: string;
  priority?: "high" | "medium" | "low";
  phase?: string;
  maintenance_tips?: string;
};

export type PhotoToScopeResult = {
  project_id: string | null;
  summary: EstimateSummary;
  scope_items: ScopeItemPreview[];
  explanations: string[];
  area_label?: string;
};
