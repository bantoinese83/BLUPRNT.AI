export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  category: string | null;
  scope_item_id?: string | null;
};

export type ScopeSuggestion = {
  scope_item_id: string;
  confidence_score: number;
  reason: string;
};

export type LedgerReviewDocument = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  subtotal: number | null;
  payment_status: string;
  line_items: LineItem[];
  budget_mapping_suggestions?: ScopeSuggestion[];
  document_id?: string | null;
  document_type?: string | null;
  warranty_expiry_date?: string | null;
  insurance_renewal_date?: string | null;
  permit_expiration_date?: string | null;
  ai_summary?: string | null;
  is_verified?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LedgerReviewSnapshot = {
  ledger_entry: LedgerReviewDocument;
  line_items: LineItem[];
  budget_mapping_suggestions?: ScopeSuggestion[];
};
