import { describe, it, expect } from "vitest";
import { calculateResaleImpact, RESALE_VALUE_CONFIG } from "./resale-value";

describe("calculateResaleImpact", () => {
  it("calculates ROI and premium correctly for a standard investment", () => {
    const investment = 10000;
    const result = calculateResaleImpact(investment);

    expect(result.estimatedValueAdd).toBe(
      10000 * RESALE_VALUE_CONFIG.ROI_SCALE,
    );
    expect(result.ledgerPremium).toBe(
      10000 * RESALE_VALUE_CONFIG.LEDGER_PREMIUM_RATE,
    );
    expect(result.totalImpact).toBe(
      result.estimatedValueAdd + result.ledgerPremium,
    );
  });

  it("returns zero for zero investment", () => {
    const result = calculateResaleImpact(0);
    expect(result.totalImpact).toBe(0);
    expect(result.ledgerPremium).toBe(0);
  });

  it("handles negative investment by flooring at zero", () => {
    const result = calculateResaleImpact(-5000);
    expect(result.totalImpact).toBe(0);
  });
});
