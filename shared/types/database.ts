import type { Database } from "@shared/types/supabase.gen";

type PublicSchema = Database["public"];

/** Subset of `projects` row fields commonly selected in the dashboard (joined selects may omit columns). */
export type ProjectRow = {
  id: string;
  name: string;
  property_id: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
  confidence_score: number | null;
  stage: string | null;
  created_at: string;
  metadata: unknown;
  before_photo_storage_path: string | null;
  after_photo_storage_path: string | null;
  grounding_sources: Array<{ title: string; url?: string }> | null;
};

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

export type InvoiceRow = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  payment_status: string;
  document_type: string | null;
  document_id: string | null;
  issue_date: string | null;
  project_id: string;
  vendor_contact_info: unknown;
  warranty_expiry_date: string | null;
};

export type InvoiceLineItemRow =
  PublicSchema["Tables"]["invoice_line_items"]["Row"];

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

export type GalleryItemRow = {
  id: string;
  project_id: string;
  photo_type: "before" | "after" | "progress";
  storage_path: string;
  caption: string | null;
  uploaded_by_user_id: string;
  created_at: string;
};
