import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

Deno.test({
  name: "send-email - returns 401 when no session",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    Deno.env.set("UPSTASH_REDIS_REST_URL", "");
    Deno.env.set("UPSTASH_REDIS_REST_TOKEN", "");

    const payload = { subject: "Test", html: "<p>Hello</p>" };
    // Mocking the request object as a plain object since Request methods are failing in this env
    const req = {
      method: "POST",
      headers: new Headers({ "Authorization": "Bearer invalid" }),
      clone: function() { return this; },
      json: async () => payload,
    } as unknown as Request;

    const res = await handler(req, payload);
    assertEquals(res.status, 401);
  },
});

Deno.test({
  name: "send-email - returns 200 on success (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    Deno.env.set("BREVO_API_KEY", "test-key");
    Deno.env.set("UPSTASH_REDIS_REST_URL", "");
    Deno.env.set("UPSTASH_REDIS_REST_TOKEN", "");

    const mockUser = {
      id: "u1",
      email: "test@example.com",
    };

    const restoreFetch = mockFetch({
      "https://elucgaegaihkklnfoasm.supabase.co/auth/v1/user": { user: mockUser },
      "https://elucgaegaihkklnfoasm.supabase.co/auth/v1/admin/users/u1":
        { user: mockUser },
      "https://api.brevo.com/v3/smtp/email": { messageId: "msg-123" },
    });

    try {
      const payload = {
        subject: "Test Subject",
        html: "<p>Hello</p>",
        to: "test@example.com",
      };
      const req = {
        method: "POST",
        headers: new Headers({
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        }),
        clone: function() { return this; },
        json: async () => payload,
      } as unknown as Request;

      const res = await handler(req, payload);
      const body = await res.json();
      assertEquals(res.status, 200);
      assertEquals(body.success, true);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "send-email - allows service role to send to anyone",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const serviceKey = "test-service-key"; 
    Deno.env.set("BREVO_API_KEY", "test-key");

    const restoreFetch = mockFetch({
      "https://api.brevo.com/v3/smtp/email": { messageId: "system-msg" },
    });

    try {
      const payload = {
        subject: "System Alert",
        html: "<p>Something happened</p>",
        to: "anyone@example.com",
      };
      const req = {
        method: "POST",
        headers: new Headers({
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        }),
        clone: function() { return this; },
        json: async () => payload,
      } as unknown as Request;

      const res = await handler(req, payload);
      assertEquals(res.status, 200);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "send-email - uses templates correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const serviceKey = "test-service-key";
    Deno.env.set("BREVO_API_KEY", "test-key");

    let capturedBrevoBody: any = null;
    const restoreFetch = mockFetch({
      "https://api.brevo.com/v3/smtp/email": async (brevoReq: Request) => {
        // Use req.text() instead of req.json() to avoid environment bugs
        const text = await brevoReq.text();
        capturedBrevoBody = JSON.parse(text);
        return { messageId: "template-msg" };
      },
    });

    try {
      const payload = {
        template: "welcome",
        params: { userName: "Alice" },
        to: "welcome@example.com",
      };
      const req = {
        method: "POST",
        headers: new Headers({
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        }),
        clone: function() { return this; },
        json: async () => payload,
      } as unknown as Request;

      const res = await handler(req, payload);
      assertEquals(res.status, 200);
      
      assertEquals(capturedBrevoBody.subject, "Welcome to BLUPRNT.AI!");
      assertEquals(capturedBrevoBody.htmlContent.includes("Welcome, Alice!"), true);
      assertEquals(capturedBrevoBody.to[0].email, "welcome@example.com");
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "send-email - escapes template parameters for XSS protection",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const serviceKey = "test-service-key";
    Deno.env.set("BREVO_API_KEY", "test-key");

    let capturedBrevoBody: any = null;
    const restoreFetch = mockFetch({
      "https://api.brevo.com/v3/smtp/email": async (brevoReq: Request) => {
        const text = await brevoReq.text();
        capturedBrevoBody = JSON.parse(text);
        return { messageId: "xss-msg" };
      },
    });

    try {
      const payload = {
        template: "welcome",
        params: { userName: "<script>alert('XSS')</script>" },
        to: "xss@example.com",
      };
      const req = {
        method: "POST",
        headers: new Headers({
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        }),
        clone: function() { return this; },
        json: async () => payload,
      } as unknown as Request;

      const res = await handler(req, payload);
      assertEquals(res.status, 200);
      
      // Verify the script tag is escaped
      assertEquals(capturedBrevoBody.htmlContent.includes("&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;"), true);
      assertEquals(capturedBrevoBody.htmlContent.includes("<script>"), false);
    } finally {
      restoreFetch();
    }
  },
});
