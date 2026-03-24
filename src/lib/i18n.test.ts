import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("formats currency deterministically with explicit locale", () => {
    expect(formatCurrency(1200, { locale: "en-US", currency: "USD" })).toBe("$1,200");
  });

  it("formats compact numbers", () => {
    const value = formatCompactNumber(15400, "en-US");
    expect(value.toLowerCase()).toContain("k");
  });
});
