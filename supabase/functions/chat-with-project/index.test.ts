import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

const USER_1 = "550e8400-e29b-41d4-a716-446655440000";
const PROJECT_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

Deno.test("chat-with-project - returns 401 when no session", async () => {
  const req = new Request("http://localhost/chat-with-project", {
    method: "POST",
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test("chat-with-project - returns 405 for GET", async () => {
  const req = new Request("http://localhost/chat-with-project", {
    method: "GET",
  });

  const res = await handler(req);
  assertEquals(res.status, 405);
});

Deno.test({
  name: "chat-with-project - returns 200 with AI reply (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    Deno.env.set("GEMINI_API_KEY", "test-key");

    const mockUser = { id: USER_1, email: "test@example.com" };
    const mockProject = {
      id: PROJECT_1,
      name: "Test Project",
      stage: "Planning",
    };

    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: mockUser },
      "/rest/v1/projects": (url: string) => {
        if (url.includes("properties.owner_user_id")) {
          return [{ id: PROJECT_1, properties: { owner_user_id: USER_1 } }];
        }
        return mockProject;
      },
      "/rest/v1/scope_items": [],
      "/rest/v1/invoices": [],
      "googleapis.com": {
        candidates: [{
          content: { parts: [{ text: "This is a test reply from Gemini." }] },
          finishReason: "STOP",
        }],
      },
    });

    try {
      const req = new Request("http://localhost/chat-with-project", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: PROJECT_1,
          query: "What is my budget?",
        }),
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.reply, "This is a test reply from Gemini.");
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "chat-with-project - returns 403 when project not found",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/projects": [],
    });
    try {
      const req = new Request("http://localhost/chat-with-project", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: PROJECT_1,
          query: "hi",
        }),
      });
      const res = await handler(req);
      assertEquals(res.status, 403);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "chat-with-project - returns 403 when user doesn't own project",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/projects": (url: string) => {
        if (url.includes(`properties.owner_user_id=eq.${USER_1}`)) {
          return [];
        }
        return {
          id: PROJECT_1,
          properties: { owner_user_id: "550e8400-e29b-41d4-a716-446655440001" },
        };
      },
    });
    try {
      const req = new Request("http://localhost/chat-with-project", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: PROJECT_1,
          query: "hi",
        }),
      });
      const res = await handler(req);
      assertEquals(res.status, 403);
    } finally {
      restoreFetch();
    }
  },
});
