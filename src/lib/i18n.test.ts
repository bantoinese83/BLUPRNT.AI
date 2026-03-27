import { describe, expect, it, vi } from "vitest";
import { formatCompactNumber, formatCurrency, getAppLocale } from "@/lib/i18n";

describe("i18n helpers", () => {
  describe("getAppLocale", () => {
    it("returns navigator.language if available", () => {
      vi.stubGlobal("navigator", { language: "fr-FR" });
      expect(getAppLocale()).toBe("fr-FR");
      vi.unstubAllGlobals();
    });

    it("defaults to en-US if navigator is undefined", () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error: Mocking global navigator
      delete global.navigator;
      expect(getAppLocale()).toBe("en-US");
      global.navigator = originalNavigator;
    });
  });

  describe("formatCurrency", () => {
    it("formats currency deterministically with explicit locale", () => {
      expect(formatCurrency(1200, { locale: "en-US", currency: "USD" })).toBe(
        "$1,200",
      );
    });

    it("uses default options when none provided", () => {
      // Just check it doesn't crash and returns a string with $ for USD default
      const result = formatCurrency(1200);
      expect(result).toContain("$");
    });

    it("respects maximumFractionDigits", () => {
      expect(
        formatCurrency(1200.55, { locale: "en-US", maximumFractionDigits: 2 }),
      ).toBe("$1,200.55");
      expect(
        formatCurrency(1200.55, { locale: "en-US", maximumFractionDigits: 0 }),
      ).toBe("$1,201");
    });
  });

  describe("formatCompactNumber", () => {
    it("formats compact numbers", () => {
      const value = formatCompactNumber(15400, "en-US");
      expect(value.toLowerCase()).toContain("k");
    });

    it("works with default locale", () => {
      const value = formatCompactNumber(1000000);
      expect(value.toLowerCase()).toContain("m");
    });
  });
});
