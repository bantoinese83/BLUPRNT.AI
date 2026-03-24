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

export type UserSubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "architect";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_end: string | null;
  invoice_uploads_count: number;
  invoice_uploads_reset_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProjectPassRow = {
  id: string;
  project_id: string;
  stripe_checkout_session_id: string | null;
  purchased_at: string;
  expires_at: string;
  created_at: string | null;
};
