import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

Deno.test("photo-to-scope: returns 405 for GET", { sanitizeOps: false, sanitizeResources: false }, async () => {
  setupTestEnv();
  const req = new Request("http://localhost/photo-to-scope", { method: "GET" });
  const res = await handler(req);
  assertEquals(res.status, 405);
});

Deno.test("photo-to-scope: returns 400 when photos and description are missing", { sanitizeOps: false, sanitizeResources: false }, async () => {
  setupTestEnv();
  const formData = new FormData();
  formData.append("room_type", "kitchen");
  formData.append("zip_code", "12345");

  const req = new Request("http://localhost/photo-to-scope", {
    method: "POST",
    body: formData,
  });

  // Mock rate limit check to pass
  const unmock = mockFetch({
    "upstash": { success: true },
  });

  try {
    const res = await handler(req);
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Provide at least one photo or a description.");
  } finally {
    unmock();
  }
});

Deno.test("photo-to-scope: returns 403 for unauthorized project", { sanitizeOps: false, sanitizeResources: false }, async () => {
  setupTestEnv();
  const projectId = "11111111-1111-1111-1111-111111111111";
  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("scope_description", "Test");

  const req = new Request("http://localhost/photo-to-scope", {
    method: "POST",
    body: formData,
    headers: {
      "Authorization": "Bearer test-token",
    },
  });

  const unmock = mockFetch({
    "upstash": { success: true },
    // Mock user auth
    "auth/v1/user": { id: "user-1" },
    // Mock project owner check (fail with 403)
    "projects": () => new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
  });

  try {
    const res = await handler(req);
    assertEquals(res.status, 403);
    const data = await res.json();
    assertEquals(data.error, "Access denied");
  } finally {
    unmock();
  }
});
