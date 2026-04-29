import type { Database } from "./supabase.gen.ts";

type PublicSchema = Database["public"];

import type { ScopeMetadata, ProjectMetadata } from "./metadata.ts";

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
  metadata: ProjectMetadata | null;
  before_photo_storage_path: string | null;
  after_photo_storage_path: string | null;
  grounding_sources: Array<{ title: string; url?: string }> | null;
};

export type ScopeRow = Omit<
  PublicSchema["Tables"]["scope_items"]["Row"],
  "metadata"
> & {
  metadata: ScopeMetadata | null;
};

export type LedgerEntryRow = PublicSchema["Tables"]["ledger_entries"]["Row"];

export type LedgerEntryWithLines = LedgerEntryRow & {
  ledger_line_items?: LedgerLineItemRow[];
};

export type LedgerLineItemRow =
  PublicSchema["Tables"]["ledger_line_items"]["Row"];

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
  photo_type: "before" | "after" | "progress" | string;
  storage_path: string;
  caption: string | null;
  uploaded_by_user_id: string;
  created_at: string | null;
};

export type PhysicalAssetRow = {
  id: string;
  project_id: string;
  name: string;
  category: string;
  brand: string | null;
  color_name: string | null;
  color_code: string | null;
  finish: string | null;
  location_in_home: string | null;
  notes: string | null;
  storage_path: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DocumentProcessingQueueRow =
  PublicSchema["Tables"]["document_processing_queue"]["Row"];
