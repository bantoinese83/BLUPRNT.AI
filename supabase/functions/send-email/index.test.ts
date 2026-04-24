import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

Deno.test("send-email - returns 401 when no session", async () => {
  const req = new Request("http://localhost/send-email", {
    method: "POST",
    body: JSON.stringify({ subject: "Test", html: "<p>Hello</p>" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test({
  name: "send-email - returns 200 on success (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    Deno.env.set("BREVO_API_KEY", "test-key");
    
    const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000", email: "test@example.com" };
    
    const restoreFetch = mockFetch({
      "http://localhost:54321/auth/v1/user": { user: mockUser },
      "http://localhost:54321/auth/v1/admin/users/550e8400-e29b-41d4-a716-446655440000": { user: mockUser },
      "https://api.brevo.com/v3/smtp/email": { messageId: "msg-123" }
    });

    try {
      const req = new Request("http://localhost/send-email", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          subject: "Test Subject", 
          html: "<p>Hello</p>",
          to: "test@example.com"
        }),
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.data.messageId, "msg-123");
    } finally {
      restoreFetch();
    }
  }
});


