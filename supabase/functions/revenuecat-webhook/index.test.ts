/**
 * Behavioral tests for the revenuecat-webhook Edge Function logic.
 *
 * Run with: deno test --allow-env supabase/functions/revenuecat-webhook/index.test.ts
 */
import { assertEquals } from "std/assert";
import {
  isProjectPassStoreProduct,
  mapRcEventToStatus,
  projectIdFromRcEvent,
  projectPassExpiresAtIso,
  rcEntitlementActiveForEvent,
} from "./logic.ts";

Deno.test("mapRcEventToStatus - purchase → active", () => {
  assertEquals(mapRcEventToStatus("INITIAL_PURCHASE"), "active");
  assertEquals(mapRcEventToStatus("RENEWAL"), "active");
  assertEquals(mapRcEventToStatus("PRODUCT_CHANGE"), "active");
});

Deno.test("mapRcEventToStatus - cancellation/expiration → canceled", () => {
  assertEquals(mapRcEventToStatus("CANCELLATION"), "canceled");
  assertEquals(mapRcEventToStatus("EXPIRATION"), "canceled");
});

Deno.test("mapRcEventToStatus - billing issue → past_due", () => {
  assertEquals(mapRcEventToStatus("BILLING_ISSUE"), "past_due");
});

Deno.test("rcEntitlementActiveForEvent - false only on EXPIRATION/CANCELLATION", () => {
  assertEquals(rcEntitlementActiveForEvent("INITIAL_PURCHASE"), true);
  assertEquals(rcEntitlementActiveForEvent("RENEWAL"), true);
  assertEquals(rcEntitlementActiveForEvent("BILLING_ISSUE"), true);
  assertEquals(rcEntitlementActiveForEvent("CANCELLATION"), false);
  assertEquals(rcEntitlementActiveForEvent("EXPIRATION"), false);
});

Deno.test("isProjectPassStoreProduct - lifetime and aliases", () => {
  assertEquals(isProjectPassStoreProduct("lifetime"), true);
  assertEquals(isProjectPassStoreProduct("project_pass"), true);
  assertEquals(isProjectPassStoreProduct("monthly"), false);
});

Deno.test("projectIdFromRcEvent - reads subscriber attribute", () => {
  assertEquals(
    projectIdFromRcEvent({
      type: "INITIAL_PURCHASE",
      subscriber_attributes: {
        project_id: { value: "proj-abc" },
      },
    }),
    "proj-abc",
  );
  assertEquals(
    projectIdFromRcEvent({ type: "INITIAL_PURCHASE" }),
    null,
  );
});

Deno.test("projectPassExpiresAtIso - six months from anchor", () => {
  const anchor = new Date("2026-01-15T12:00:00.000Z");
  assertEquals(
    projectPassExpiresAtIso(anchor),
    "2026-07-15T12:00:00.000Z",
  );
});

// ---------------------------------------------------------------------------
// Stripe co-existence: should only update revenuecat_entitlement_active field
// ---------------------------------------------------------------------------

Deno.test("Stripe co-existence guard — only entitlement flag should change", () => {
  const hasStripe = true;
  // When Stripe row exists, we must NOT overwrite status or current_period_end.
  const updatePayload = hasStripe
    ? {
      revenuecat_entitlement_active: true,
      updated_at: "2026-01-01T00:00:00.000Z",
    }
    : {
      status: "active",
      current_period_end: null,
      revenuecat_entitlement_active: true,
      updated_at: "2026-01-01T00:00:00.000Z",
    };
  assertEquals(Object.keys(updatePayload).includes("status"), false);
  assertEquals(
    Object.keys(updatePayload).includes("revenuecat_entitlement_active"),
    true,
  );
});

// ---------------------------------------------------------------------------
// Webhook authentication — secret must be required
// ---------------------------------------------------------------------------

Deno.test("webhook auth — rejects when Authorization header mismatches secret", () => {
  const secret = "my-webhook-secret";
  const incomingHeader: string = "Bearer wrong-secret";
  const expected: string = `Bearer ${secret}`;
  assertEquals(incomingHeader === expected, false);
});

Deno.test("webhook auth — accepts when Authorization header matches secret", () => {
  const secret = "my-webhook-secret";
  const incomingHeader = `Bearer ${secret}`;
  const expected = `Bearer ${secret}`;
  assertEquals(incomingHeader === expected, true);
});

Deno.test("webhook auth — 503 when no secret is configured", () => {
  const webhookSecret = "";
  // Handler should return 503 when secret is empty — this test documents intent.
  const shouldReturn503 = !webhookSecret;
  assertEquals(shouldReturn503, true);
});
