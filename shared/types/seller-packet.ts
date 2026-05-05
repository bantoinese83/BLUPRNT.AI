/**
 * Shared input types for the Seller Packet / Property Improvement Ledger PDF export.
 * Used by both web (jsPDF) and mobile (expo-print) generators.
 */

export type SellerPacketScopeInput = {
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

export type SellerPacketLedgerInput = {
  id?: string;
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  document_type?: string | null;
  document_id?: string | null;
};

export type SellerPacketProjectInput = {
  id?: string;
  name: string;
  property_id?: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
};
