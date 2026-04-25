import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { setupTestEnv } from "../_shared/test-utils.ts";

Deno.test("stripe-webhook - returns 405 for GET", async () => {
  const req = new Request("http://localhost/stripe-webhook", {
    method: "GET",
  });

  const res = await handler(req);
  assertEquals(res.status, 405);
});

Deno.test("stripe-webhook - returns 500 when no signature or secret", async () => {
  setupTestEnv();
  // Ensure secrets are NOT set
  Deno.env.delete("STRIPE_WEBHOOK_SECRET");

  const req = new Request("http://localhost/stripe-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: "evt_123" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 500);
  const text = await res.text();
  assertEquals(text, "Webhook not configured");
});
