import { assertEquals } from "std/assert";
import { handler } from "./index.ts";
import { mockFetch, setupTestEnv } from "../_shared/test-utils.ts";

Deno.test("upload-gallery-photo - returns 401 when no session", async () => {
  const req = new Request("http://localhost/upload-gallery-photo", {
    method: "POST",
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test("upload-gallery-photo - returns 405 for GET", async () => {
  const req = new Request("http://localhost/upload-gallery-photo", {
    method: "GET",
  });

  const res = await handler(req);
  assertEquals(res.status, 405);
});

Deno.test({
  name: "upload-gallery-photo - returns 200 on success (happy path)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    setupTestEnv();

    const mockUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
    };
    const _mockProject = {
      id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      owner_user_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const restoreFetch = mockFetch({
      "http://localhost:54321/auth/v1/user": { user: mockUser },
      "http://localhost:54321/rest/v1/projects": {
        id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        properties: { owner_user_id: "550e8400-e29b-41d4-a716-446655440000" },
      },
      "http://localhost:54321/storage/v1/object/project-photos": {
        Key: "some-key",
      },
      "http://localhost:54321/rest/v1/project_gallery": { id: "gallery-1" },
    });

    try {
      const formData = new FormData();
      const file = new File(["test data"], "test.jpg", { type: "image/jpeg" });
      formData.append("file", file);
      formData.append("project_id", "6ba7b811-9dad-11d1-80b4-00c04fd430c8");
      formData.append("type", "before");

      const req = new Request("http://localhost/upload-gallery-photo", {
        method: "POST",
        headers: {
          "Authorization": "Bearer some-jwt",
        },
        body: formData,
      });

      const res = await handler(req);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.id, "gallery-1");
    } finally {
      restoreFetch();
    }
  },
});
