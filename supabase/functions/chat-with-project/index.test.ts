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
    Deno.env.set("UPSTASH_REDIS_REST_URL", "");
    Deno.env.set("UPSTASH_REDIS_REST_TOKEN", "");

    const mockUser = { id: USER_1, email: "test@example.com" };
    const mockProject = {
      id: PROJECT_1,
      name: "Test Project",
      stage: "Planning",
      estimated_min_total: 1000,
      estimated_max_total: 5000,
    };

    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: mockUser },
      "/rest/v1/projects": (req: Request) => {
        const url = req.url;
        if (url.includes("select=id") && url.includes("owner_user_id=eq.")) {
          return [{ id: PROJECT_1 }];
        }
        if (url.includes("select=*") && url.includes("id=eq.")) {
          return mockProject;
        }
        return [];
      },
      "/rest/v1/rpc/match_document_embeddings": [],
      "/rest/v1/scope_items": [],
      "/rest/v1/ledger_entries": [],
      "googleapis.com": {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                reply: "This is a test reply from Gemini.",
                actions: [],
              }),
            }],
          },
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
  name: "chat-with-project - returns 400 for malformed JSON",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
    });
    try {
      const req = new Request("http://localhost/chat-with-project", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: "invalid-json",
      });

      const res = await handler(req);
      assertEquals(res.status, 400);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "chat-with-project - returns 400 for excessively long query",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
    });
    try {
      const longQuery = "a".repeat(8001);
      const req = new Request("http://localhost/chat-with-project", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: PROJECT_1,
          query: longQuery,
        }),
      });

      const res = await handler(req);
      assertEquals(res.status, 400);
    } finally {
      restoreFetch();
    }
  },
});

Deno.test({
  name: "chat-with-project - returns 500 when Gemini returns garbage",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/auth/v1/user": { user: { id: USER_1 } },
      "/rest/v1/projects": [{ id: PROJECT_1 }],
      "googleapis.com": { candidates: [{ content: { parts: [{ text: "NOT JSON" }] } }] },
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
      assertEquals(res.status, 500);
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
