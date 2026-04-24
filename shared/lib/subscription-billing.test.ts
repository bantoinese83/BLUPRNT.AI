import { describe, it, expect } from "vitest";
import {
  hasDuplicateWebAndStoreSubscriptions,
  architectBillingChannel,
} from "./subscription-billing";

import type { UserSubscriptionRow } from "../types/database";

describe("subscription-billing shared logic", () => {
  describe("hasDuplicateWebAndStoreSubscriptions", () => {
    it("returns true when both stripe and revenuecat are active", () => {
      const sub = {
        stripe_subscription_id: "sub_123",
        revenuecat_entitlement_active: true,
      } as unknown as UserSubscriptionRow;
      expect(hasDuplicateWebAndStoreSubscriptions(sub)).toBe(true);
    });

    it("returns false when only stripe is active", () => {
      const sub = {
        stripe_subscription_id: "sub_123",
        revenuecat_entitlement_active: false,
      } as unknown as UserSubscriptionRow;
      expect(hasDuplicateWebAndStoreSubscriptions(sub)).toBe(false);
    });

    it("returns false when only revenuecat is active", () => {
      const sub = {
        stripe_subscription_id: null,
        revenuecat_entitlement_active: true,
      } as unknown as UserSubscriptionRow;
      expect(hasDuplicateWebAndStoreSubscriptions(sub)).toBe(false);
    });

    it("returns false for null sub", () => {
      expect(hasDuplicateWebAndStoreSubscriptions(null)).toBe(false);
    });
  });

  describe("architectBillingChannel", () => {
    it("returns stripe when only stripe is active and status is active", () => {
      const sub = {
        stripe_subscription_id: "sub_123",
        status: "active",
        revenuecat_entitlement_active: false,
      } as unknown as UserSubscriptionRow;
      expect(architectBillingChannel(sub)).toBe("stripe");
    });

    it("returns store when only revenuecat is active", () => {
      const sub = {
        stripe_subscription_id: null,
        revenuecat_entitlement_active: true,
      } as unknown as UserSubscriptionRow;
      expect(architectBillingChannel(sub)).toBe("store");
    });

    it("returns mixed when both are active", () => {
      const sub = {
        stripe_subscription_id: "sub_123",
        status: "active",
        revenuecat_entitlement_active: true,
      } as unknown as UserSubscriptionRow;
      expect(architectBillingChannel(sub)).toBe("mixed");
    });

    it("returns unknown when neither is effectively active", () => {
      const sub = {
        stripe_subscription_id: "sub_123",
        status: "canceled",
        revenuecat_entitlement_active: false,
      } as unknown as UserSubscriptionRow;
      expect(architectBillingChannel(sub)).toBe("unknown");
    });

    it("returns unknown for null sub", () => {
      expect(architectBillingChannel(null)).toBe("unknown");
    });
  });
});
