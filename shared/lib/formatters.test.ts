import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { money, formatShortUsDate, getWarrantyStatus } from "./formatters";

describe("formatters", () => {
  describe("money", () => {
    it("formats single values", () => {
      expect(money(1234)).toBe("$1,234");
    });

    it("formats ranges", () => {
      expect(money(1000, 2000)).toBe("$1,000 – $2,000");
    });

    it("handles identical range values", () => {
      expect(money(1000, 1000)).toBe("$1,000");
    });

    it("returns placeholder for non-finite values", () => {
      expect(money(null)).toBe("—");
      expect(money(NaN)).toBe("—");
    });
  });

  describe("formatShortUsDate", () => {
    it("formats valid ISO strings", () => {
      // Use T12:00:00 to avoid timezone shifting to previous/next day
      expect(formatShortUsDate("2026-04-22T12:00:00")).toBe("Apr 22, 2026");
    });

    it("returns original string for invalid dates", () => {
      expect(formatShortUsDate("not-a-date")).toBe("not-a-date");
    });

    it("returns placeholder for empty input", () => {
      expect(formatShortUsDate("")).toBe("—");
    });
  });

  describe("getWarrantyStatus", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-22"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns null for no expiry", () => {
      expect(getWarrantyStatus(null)).toBeNull();
    });

    it("calculates remaining years", () => {
      const status = getWarrantyStatus("2028-04-22"); // 2 years
      expect(status?.isExpired).toBe(false);
      expect(status?.label).toBe("2.0y remaining");
    });

    it("calculates remaining days", () => {
      const status = getWarrantyStatus("2026-04-25"); // 3 days
      expect(status?.isExpired).toBe(false);
      expect(status?.label).toBe("3d remaining");
    });

    it("identifies expired warranties", () => {
      const status = getWarrantyStatus("2025-04-22");
      expect(status?.isExpired).toBe(true);
      expect(status?.label).toBe("Expired");
    });
  });
});
