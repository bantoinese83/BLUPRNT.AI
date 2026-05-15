import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const STRIPE_CUSTOMER_ID = "cus_test123";

Deno.test({
  name: "create-portal-session - returns 401 when no session",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const req = new Request("http://localhost/create-portal-session", {
      method: "POST",
    });

    const res = await handler(req);
    assertEquals(res.status, 401);
  },
});

Deno.test({
  name: "create-portal-session - returns 404 when no stripe customer found",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_ID } },
      "/rest/v1/user_subscriptions": [], // Empty list = no subscription row
    });

    try {
      const req = new Request("http://localhost/create-portal-session", {
        method: "POST",
        headers: { "Authorization": "Bearer test-jwt" },
      });

      const res = await handler(req);
      assertEquals(res.status, 404);
      const data = await res.json();
      assertEquals(data.error, "No Stripe customer found for this user.");
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "create-portal-session - happy path returns portal url",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    Deno.env.set("STRIPE_SECRET_KEY", "sk_test_fake");
    
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_ID } },
      "/rest/v1/user_subscriptions": [{ stripe_customer_id: STRIPE_CUSTOMER_ID }],
      "api.stripe.com/v1/billing_portal/sessions": {
        url: "https://billing.stripe.com/p/session/test_123",
      },
    });

    try {
      const req = new Request("http://localhost/create-portal-session", {
        method: "POST",
        headers: { "Authorization": "Bearer test-jwt" },
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(data.url, "https://billing.stripe.com/p/session/test_123");
    } finally {
      restoreFetch();
    }
  },
});
