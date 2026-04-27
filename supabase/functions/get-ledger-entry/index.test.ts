import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

const USER_1 = "550e8400-e29b-41d4-a716-446655440000";
const PROJECT_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const LEDGER_ENTRY_1 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

Deno.test("get-ledger-entry - returns 401 when no authorization header", async () => {
  const req = new Request("http://localhost/get-ledger-entry", {
    method: "POST",
    body: JSON.stringify({ ledger_entry_id: LEDGER_ENTRY_1 }),
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test({
  name: "get-ledger-entry - returns 200 with ledger entry data (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();

    const mockUser = { id: USER_1, email: "test@example.com" };
    const mockLedgerEntry = {
      id: LEDGER_ENTRY_1,
      project_id: PROJECT_1,
      vendor_name: "Plumbing Pros",
      total: 1500.00,
      payment_status: "pending",
    };

    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: mockUser },
      "/rest/v1/ledger_entries": mockLedgerEntry,
      "/rest/v1/projects": {
        id: PROJECT_1,
        properties: { owner_user_id: USER_1 },
      },
      "/rest/v1/ledger_line_items": [],
      "/rest/v1/scope_items": [],
    });

    try {
      const req = new Request("http://localhost/get-ledger-entry", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ledger_entry_id: LEDGER_ENTRY_1 }),
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "get-ledger-entry - returns 404 when ledger entry not found",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/ledger_entries": () =>
        new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }),
    });
    try {
      const req = new Request("http://localhost/get-ledger-entry", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ledger_entry_id: LEDGER_ENTRY_1 }),
      });
      const res = await handler(req);
      assertEquals(res.status, 404);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "get-ledger-entry - returns 403 when user doesn't own project",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/ledger_entries": { project_id: PROJECT_1 },
      "/rest/v1/projects": [],
    });
    try {
      const req = new Request("http://localhost/get-ledger-entry", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ledger_entry_id: LEDGER_ENTRY_1 }),
      });
      const res = await handler(req);
      assertEquals(res.status, 403);
    } finally {
      restoreFetch();
    }
  },
});
