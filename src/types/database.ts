export type ProjectRow = {
  id: string;
  name: string;
  property_id?: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
  confidence_score: number | null;
  stage: string | null;
  created_at?: string;
  metadata?: {
    value_engineering_tips?: string[];
    regional_context?: string;
    regional_signal?: string;
  };
};

export type ScopeRow = {
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
  confidence_reason?: string;
  source?: "text" | "photo";
  justification?: string;
  priority?: "high" | "medium" | "low";
  phase?: string;
  maintenance_tips?: string;
  metadata?: {
    justification?: string;
    priority?: "high" | "medium" | "low";
    phase?: string;
    maintenance_tips?: string;
    confidence_reason?: string;
  };
};

export type InvoiceRow = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  payment_status: string;
  document_type?: string | null;
};
