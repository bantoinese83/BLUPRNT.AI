/**
 * Shared logic for calculating the estimated resale value impact of property improvements.
 */

export const RESALE_VALUE_CONFIG = {
  ROI_SCALE: 1.25, // 1.25x ROI on quality renovations
  LEDGER_PREMIUM_RATE: 0.05, // 5% bonus for professional documentation
} as const;

export interface ResaleImpactResult {
  estimatedValueAdd: number;
  ledgerPremium: number;
  totalImpact: number;
}

/**
 * Calculates the estimated increase in home value based on investment and documentation quality.
 */
export function calculateResaleImpact(investment: number): ResaleImpactResult {
  const actualInvestment = Math.max(0, investment);

  const estimatedValueAdd = actualInvestment * RESALE_VALUE_CONFIG.ROI_SCALE;
  const ledgerPremium =
    actualInvestment > 0
      ? actualInvestment * RESALE_VALUE_CONFIG.LEDGER_PREMIUM_RATE
      : 0;

  return {
    estimatedValueAdd,
    ledgerPremium,
    totalImpact: estimatedValueAdd + ledgerPremium,
  };
}
