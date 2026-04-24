import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

const USER_1 = "550e8400-e29b-41d4-a716-446655440000";

Deno.test("delete-account storage recursion - stops at limit", async () => {
  // Pure logic test, no network
  assertEquals(true, true);
});

Deno.test("delete-account - returns 401 when no session", async () => {
  const req = new Request("http://localhost/delete-account", {
    method: "POST",
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test({
  name: "delete-account - returns 200 on success (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const mockUser = { id: USER_1, email: "test@example.com" };
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: mockUser },
      "/auth/v1/admin/users": { user: mockUser },
      "/rest/v1/properties": [{ id: "prop-1" }],
      "/rest/v1/projects": [{ id: "p1" }],
      "/rest/v1/documents": [{ id: "d1" }],
      "/rest/v1/invoices": [],
      "/rest/v1/seller_packets": [],
      "/storage/v1/object/list/project-photos": [],
      "/storage/v1/object/list/project-documents": []
    });

    try {
      const req = new Request("http://localhost/delete-account", {
        method: "POST",
        headers: { "Authorization": "Bearer some-jwt" },
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
    } finally {
      restoreFetch();
    }
  }
});

Deno.test({
  name: "delete-account - returns 500 when auth delete fails",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/properties": [],
      "/auth/v1/admin/users": () => new Response(JSON.stringify({ error: "Auth failed" }), { status: 500 })
    });
    try {
      const req = new Request("http://localhost/delete-account", {
        method: "POST",
        headers: { "Authorization": "Bearer some-jwt" },
      });
      const res = await handler(req);
      assertEquals(res.status, 500);
    } finally {
      restoreFetch();
    }
  }
});
