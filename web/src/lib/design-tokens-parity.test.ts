import { describe, it, expect } from "vitest";
import { BLUPRNT_COLORS } from "@shared/constants/design-tokens";

/** Guardrail: mobile Theme + web `@theme` must stay aligned with shared tokens. */
describe("BLUPRNT_COLORS", () => {
  it("matches web index.css @theme primary / surface / accent / ink", () => {
    expect(BLUPRNT_COLORS.primary).toBe("#134e4a");
    expect(BLUPRNT_COLORS.primaryHover).toBe("#115e59");
    expect(BLUPRNT_COLORS.surface).toBe("#f9fafb");
    expect(BLUPRNT_COLORS.accent).toBe("#0d9488");
    expect(BLUPRNT_COLORS.ink).toBe("#111827");
  });
});
