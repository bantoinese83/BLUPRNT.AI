import type { Database } from "@shared/types/supabase.gen";

type PublicSchema = Database["public"];

/** Subset of `projects` row fields commonly selected in the dashboard (joined selects may omit columns). */
export type ProjectRow = Pick<
  PublicSchema["Tables"]["projects"]["Row"],
  | "id"
  | "name"
  | "property_id"
  | "estimated_min_total"
  | "estimated_max_total"
  | "confidence_score"
  | "stage"
  | "created_at"
  | "metadata"
>;

export type ScopeRow = Pick<
  PublicSchema["Tables"]["scope_items"]["Row"],
  | "id"
  | "category"
  | "description"
  | "finish_tier"
  | "quantity"
  | "unit"
  | "unit_cost_min"
  | "unit_cost_max"
  | "total_cost_min"
  | "total_cost_max"
  | "confidence_score"
  | "confidence_reason"
  | "source"
  | "justification"
  | "priority"
  | "phase"
  | "maintenance_tips"
  | "metadata"
>;

export type InvoiceRow = Pick<
  PublicSchema["Tables"]["invoices"]["Row"],
  | "id"
  | "vendor_name"
  | "total"
  | "created_at"
  | "payment_status"
  | "document_type"
  | "document_id"
>;

export type UserSubscriptionRow =
  PublicSchema["Tables"]["user_subscriptions"]["Row"];
export type ProjectPassRow = PublicSchema["Tables"]["project_passes"]["Row"];

export type OnboardingSyncRow = {
  id: string;
  token: string;
  payload: Record<string, unknown>;
  expires_at: string;
  created_at: string;
};
