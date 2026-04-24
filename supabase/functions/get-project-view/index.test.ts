import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

const PROJECT_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

Deno.test("get-project-view - returns 400 when token is missing", async () => {
  const req = new Request("http://localhost/get-project-view", {
    method: "GET",
  });

  const res = await handler(req);
  assertEquals(res.status, 400);
});

Deno.test("get-project-view - returns 405 for POST", async () => {
  const req = new Request("http://localhost/get-project-view", {
    method: "POST",
  });

  const res = await handler(req);
  assertEquals(res.status, 405);
});

Deno.test({
  name: "get-project-view - returns 200 with project data (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    
    const mockTokenRow = { 
      token: "valid-token", 
      project_id: PROJECT_1,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    };
    const mockProject = { 
      id: PROJECT_1, 
      name: "Beach House",
      stage: "Construction"
    };
    
    const restoreFetch = mockFetch({
      "/rest/v1/project_view_tokens": mockTokenRow,
      "/rest/v1/projects": mockProject,
      "/rest/v1/scope_items": []
    });

    try {
      const req = new Request("http://localhost/get-project-view?token=valid-token", {
        method: "GET",
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
    } finally {
      restoreFetch();
    }
  }
});

Deno.test({
  name: "get-project-view - returns 404 when token not found",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/rest/v1/project_view_tokens": [] 
    });
    try {
      const req = new Request("http://localhost/get-project-view?token=missing-token", {
        method: "GET",
      });
      const res = await handler(req);
      assertEquals(res.status, 404);
    } finally {
      restoreFetch();
    }
  }
});

Deno.test({
  name: "get-project-view - returns 404 when project not found",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();
    const restoreFetch = mockFetch({
      "/rest/v1/project_view_tokens": { project_id: PROJECT_1 },
      "/rest/v1/projects": () => new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }),
      "/rest/v1/scope_items": []
    });
    try {
      const req = new Request("http://localhost/get-project-view?token=valid-token", {
        method: "GET",
      });
      const res = await handler(req);
      assertEquals(res.status, 404);
    } finally {
      restoreFetch();
    }
  }
});
