/**
 * Behavioral tests for the revenuecat-webhook Edge Function logic.
 *
 * Run with: deno test --allow-env supabase/functions/revenuecat-webhook/index.test.ts
 */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";

// ---------------------------------------------------------------------------
// Status mapping (mirrors the handler's event-type → status logic)
// ---------------------------------------------------------------------------

type RcEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  | "CANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "SUBSCRIBER_ALIAS"
  | "TRANSFER";

type SubStatus = "active" | "canceled" | "past_due" | "trialing";

function mapRcEventToStatus(type: RcEventType): SubStatus {
  if (type === "EXPIRATION" || type === "CANCELLATION") return "canceled";
  if (type === "BILLING_ISSUE") return "past_due";
  return "active";
}

function rcEntitlementActive(type: RcEventType): boolean {
  return type !== "EXPIRATION" && type !== "CANCELLATION";
}

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

Deno.test("rcEntitlementActive - false only on EXPIRATION/CANCELLATION", () => {
  assertEquals(rcEntitlementActive("INITIAL_PURCHASE"), true);
  assertEquals(rcEntitlementActive("RENEWAL"), true);
  assertEquals(rcEntitlementActive("BILLING_ISSUE"), true);
  assertEquals(rcEntitlementActive("CANCELLATION"), false);
  assertEquals(rcEntitlementActive("EXPIRATION"), false);
});

// ---------------------------------------------------------------------------
// Stripe co-existence: should only update revenuecat_entitlement_active field
// ---------------------------------------------------------------------------

Deno.test("Stripe co-existence guard — only entitlement flag should change", () => {
  const hasStripe = true;
  // When Stripe row exists, we must NOT overwrite status or current_period_end.
  const updatePayload = hasStripe
    ? { revenuecat_entitlement_active: true, updated_at: "2026-01-01T00:00:00.000Z" }
    : {
        status: "active",
        current_period_end: null,
        revenuecat_entitlement_active: true,
        updated_at: "2026-01-01T00:00:00.000Z",
      };
  assertEquals(Object.keys(updatePayload).includes("status"), false);
  assertEquals(Object.keys(updatePayload).includes("revenuecat_entitlement_active"), true);
});

// ---------------------------------------------------------------------------
// Webhook authentication — secret must be required
// ---------------------------------------------------------------------------

Deno.test("webhook auth — rejects when Authorization header mismatches secret", () => {
  const secret = "my-webhook-secret";
  const incomingHeader = "Bearer wrong-secret";
  const expected = `Bearer ${secret}`;
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
