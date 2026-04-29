/**
 * Business logic thresholds for the Awareness engine.
 */
export const AWARENESS_THRESHOLDS = {
  /** Trigger warning when category spending exceeds 80% of estimate */
  CATEGORY_BUDGET_WARNING: 0.8,

  /** Trigger anomaly when line-item backed spend is less than 85% of total documented capital */
  AGGREGATE_LINE_BACKED_THRESHOLD: 0.85,

  /** Threshold for suggesting the Seller Packet ($5k investment) */
  SELLER_PACKET_MIN_INVESTMENT: 5000,
} as const;
