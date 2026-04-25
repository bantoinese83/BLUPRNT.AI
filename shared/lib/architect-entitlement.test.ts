import { describe, it, expect } from "vitest";
import {
  isArchitectGlobalUploadQuotaAvailable,
  isArchitectPlanEffective,
  isStripeArchitectSubscriptionEntitled,
  isStripeArchitectUploadPeriodOpen,
} from "./architect-entitlement.ts";

const future = "2099-01-01T00:00:00.000Z";
const past = "2020-01-01T00:00:00.000Z";
const now = new Date("2026-06-15T12:00:00.000Z");

describe("architect-entitlement", () => {
  describe("isStripeArchitectUploadPeriodOpen", () => {
    it("is true for active status with a future period end", () => {
      expect(
        isStripeArchitectUploadPeriodOpen(
          {
            status: "active",
            current_period_end: future,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(true);
    });

    it("is true for trialing with a future period end", () => {
      expect(
        isStripeArchitectUploadPeriodOpen(
          {
            status: "trialing",
            current_period_end: future,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(true);
    });

    it("is false when period ended", () => {
      expect(
        isStripeArchitectUploadPeriodOpen(
          {
            status: "active",
            current_period_end: past,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(false);
    });

    it("is false when period end is missing", () => {
      expect(
        isStripeArchitectUploadPeriodOpen(
          {
            status: "active",
            current_period_end: null,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(false);
    });
  });

  describe("isArchitectPlanEffective", () => {
    it("is true when RevenueCat entitlement is active even if Stripe status is canceled", () => {
      expect(
        isArchitectPlanEffective(
          {
            status: "canceled",
            current_period_end: past,
            revenuecat_entitlement_active: true,
          },
          now,
        ),
      ).toBe(true);
    });

    it("is true for Stripe active with future period", () => {
      expect(
        isArchitectPlanEffective(
          {
            status: "active",
            current_period_end: future,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(true);
    });

    it("is false for canceled without RC", () => {
      expect(
        isArchitectPlanEffective(
          {
            status: "canceled",
            current_period_end: future,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(false);
    });
  });

  describe("isStripeArchitectSubscriptionEntitled", () => {
    it("is true for active status when period end is not synced yet", () => {
      expect(
        isStripeArchitectSubscriptionEntitled(
          {
            status: "active",
            current_period_end: null,
            revenuecat_entitlement_active: false,
          },
          now,
        ),
      ).toBe(true);
    });

    it("grants access (null period end) but upload period is not open — intentional asymmetry", () => {
      const sub = {
        status: "active" as const,
        current_period_end: null,
        revenuecat_entitlement_active: false,
      };
      // User gets product access immediately; upload quota reset requires a known anchor.
      expect(isStripeArchitectSubscriptionEntitled(sub, now)).toBe(true);
      expect(isStripeArchitectUploadPeriodOpen(sub, now)).toBe(false);
    });
  });

  describe("isArchitectGlobalUploadQuotaAvailable", () => {
    it("allows uploads under cap when Stripe is active but period end is not synced yet", () => {
      expect(
        isArchitectGlobalUploadQuotaAvailable(
          {
            status: "active",
            current_period_end: null,
            revenuecat_entitlement_active: false,
            invoice_uploads_count: 2,
          },
          now,
          10,
        ),
      ).toBe(true);
    });

    it("allows uploads under cap when RC is active and Stripe period lapsed", () => {
      expect(
        isArchitectGlobalUploadQuotaAvailable(
          {
            status: "canceled",
            current_period_end: past,
            revenuecat_entitlement_active: true,
            invoice_uploads_count: 3,
          },
          now,
          10,
        ),
      ).toBe(true);
    });

    it("denies when at upload cap even if RC is active", () => {
      expect(
        isArchitectGlobalUploadQuotaAvailable(
          {
            status: "canceled",
            current_period_end: past,
            revenuecat_entitlement_active: true,
            invoice_uploads_count: 10,
          },
          now,
          10,
        ),
      ).toBe(false);
    });
  });
});
