/**
 * Supabase `Database` types for PostgREST.
 *
 * Regenerate from the linked project (requires `SUPABASE_ACCESS_TOKEN`):
 *   npm run db:types
 *
 * When the token is unavailable, this file remains the schema snapshot; CI can
 * verify it matches `npm run db:types` when secrets are configured.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableRow<T> = {
  Row: T;
  Insert: T extends { id: string }
    ? Omit<Partial<T>, "id"> & { id?: string }
    : Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

type ProjectsRow = {
  id: string;
  name: string;
  property_id: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
  confidence_score: number | null;
  stage: string | null;
  type: string | null;
  created_at: string;
  updated_at: string | null;
  metadata: {
    value_engineering_tips?: string[];
    regional_context?: string;
    regional_signal?: string;
  } | null;
};

type PropertiesRow = {
  id: string;
  owner_user_id: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  approximate_location: string | null;
  created_at: string;
  updated_at: string | null;
};

type ScopeItemsRow = {
  id: string;
  project_id: string;
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
  confidence_reason: string | null;
  source: "text" | "photo" | null;
  justification: string | null;
  priority: "high" | "medium" | "low" | null;
  phase: string | null;
  maintenance_tips: string | null;
  metadata: {
    justification?: string;
    priority?: "high" | "medium" | "low";
    phase?: string;
    maintenance_tips?: string;
    confidence_reason?: string;
    materials?: Array<{
      name: string;
      brand?: string;
      model?: string;
      quantity?: number;
      unit?: string;
      estimated_cost?: number;
    }>;
  } | null;
  updated_at: string | null;
};

type DocumentsRow = {
  id: string;
  project_id: string;
  type: string;
  storage_path: string;
  original_filename: string | null;
  uploaded_by_user_id: string;
  ocr_status: string;
  created_at: string;
};

type InvoicesRow = {
  id: string;
  project_id: string;
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  payment_status: string;
  document_type: string | null;
  document_id: string | null;
  updated_at: string | null;
};

type InvoiceLineItemsRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  category: string | null;
  scope_item_id: string | null;
  created_at: string;
  updated_at: string | null;
};

type UserSubscriptionsRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "architect";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_end: string | null;
  invoice_uploads_count: number;
  invoice_uploads_reset_at: string | null;
  /** True when RevenueCat reports an active App Store / Play subscription. */
  revenuecat_entitlement_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type ProjectPassesRow = {
  id: string;
  project_id: string;
  stripe_checkout_session_id: string | null;
  purchased_at: string;
  expires_at: string;
  created_at: string | null;
  updated_at: string | null;
};

type UserPreferencesRow = {
  user_id: string;
  last_active_project_id: string | null;
  push_token: string | null;
  updated_at: string | null;
};

type MarketingLeadsRow = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

type SellerPacketsRow = {
  id: string;
  project_id: string;
  property_id: string;
  created_at: string;
  generated_at: string | null;
  storage_path: string | null;
  updated_at: string | null;
};

type ProjectViewTokensRow = {
  id: string;
  project_id: string;
  token: string;
  created_at: string;
  expires_at: string;
};

type OnboardingSyncRow = {
  id: string;
  token: string;
  payload: Json;
  expires_at: string;
  created_at: string;
};

type ProjectGalleryRow = {
  id: string;
  project_id: string;
  photo_type: "before" | "after" | "progress";
  storage_path: string;
  caption: string | null;
  uploaded_by_user_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      onboarding_sync: TableRow<OnboardingSyncRow>;
      projects: TableRow<ProjectsRow>;
      properties: TableRow<PropertiesRow>;
      scope_items: TableRow<ScopeItemsRow>;
      documents: TableRow<DocumentsRow>;
      invoices: TableRow<InvoicesRow>;
      invoice_line_items: TableRow<InvoiceLineItemsRow>;
      user_subscriptions: TableRow<UserSubscriptionsRow>;
      project_passes: TableRow<ProjectPassesRow>;
      user_preferences: TableRow<UserPreferencesRow>;
      marketing_leads: TableRow<MarketingLeadsRow>;
      seller_packets: TableRow<SellerPacketsRow>;
      project_view_tokens: TableRow<ProjectViewTokensRow>;
      project_gallery: TableRow<ProjectGalleryRow>;
    };
    Views: Record<string, never>;
    Functions: {
      get_onboarding_sync_payload: {
        Args: { p_token: string };
        Returns: Json | null;
      };
      recalc_project_totals: { Args: { p_id: string }; Returns: undefined };
      release_architect_invoice_upload_slot: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      reserve_architect_invoice_upload_slot: {
        Args: { p_max_uploads?: number; p_user_id: string };
        Returns: {
          invoice_uploads_count: number;
          ok: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
