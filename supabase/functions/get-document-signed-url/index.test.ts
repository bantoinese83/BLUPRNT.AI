import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

const USER_1 = "550e8400-e29b-41d4-a716-446655440000";
const PROJECT_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const INVOICE_1 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

Deno.test("get-document-signed-url - returns 401 when no session", async () => {
  const req = new Request("http://localhost/get-document-signed-url", {
    method: "POST",
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test({
  name: "get-document-signed-url - returns 200 with signed URL (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const mockUser = { id: USER_1, email: "test@example.com" };
    const mockInvoice = { project_id: PROJECT_1, document_id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8" };
    const mockDoc = { storage_path: "path/to/doc.pdf", original_filename: "invoice.pdf" };
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: mockUser },
      "/rest/v1/invoices": mockInvoice,
      "/rest/v1/projects": { id: PROJECT_1, properties: { owner_user_id: USER_1 } },
      "/rest/v1/documents": mockDoc,
      "/storage/v1/object/sign/project-documents": { signedUrl: "/signed-url", signedURL: "/signed-url" }
    });

    try {
      const req = new Request("http://localhost/get-document-signed-url", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice_id: INVOICE_1 }),
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
    } finally {
      restoreFetch();
    }
  }
});

Deno.test({
  name: "get-document-signed-url - returns 404 when invoice not found",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/invoices": () => new Response(JSON.stringify({ error: "Not Found" }), { status: 404 })
    });
    try {
      const req = new Request("http://localhost/get-document-signed-url", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice_id: INVOICE_1 }),
      });
      const res = await handler(req);
      assertEquals(res.status, 404);
    } finally {
      restoreFetch();
    }
  }
});

Deno.test({
  name: "get-document-signed-url - returns 403 when user doesn't own project",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/invoices": { project_id: PROJECT_1 },
      "/rest/v1/projects": [] 
    });
    try {
      const req = new Request("http://localhost/get-document-signed-url", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice_id: INVOICE_1 }),
      });
      const res = await handler(req);
      assertEquals(res.status, 403);
    } finally {
      restoreFetch();
    }
  }
});
