import { assertEquals } from "std/assert";
import { API_VERSIONS, getApiVersion, isAtLeastVersion } from "./versioning.ts";

Deno.test("getApiVersion - returns V2 when header is exact", () => {
  const req = new Request("http://localhost", {
    headers: { "x-bluprnt-api-version": API_VERSIONS.V2 },
  });
  assertEquals(getApiVersion(req), API_VERSIONS.V2);
});

Deno.test("getApiVersion - defaults to V1 when header missing", () => {
  const req = new Request("http://localhost");
  assertEquals(getApiVersion(req), API_VERSIONS.V1);
});

Deno.test("getApiVersion - defaults to V1 when header is invalid", () => {
  const req = new Request("http://localhost", {
    headers: { "x-bluprnt-api-version": "old-version" },
  });
  assertEquals(getApiVersion(req), API_VERSIONS.V1);
});

Deno.test("isAtLeastVersion - correctly compares versions", () => {
  const reqV2 = new Request("http://localhost", {
    headers: { "x-bluprnt-api-version": API_VERSIONS.V2 },
  });
  const reqV1 = new Request("http://localhost", {
    headers: { "x-bluprnt-api-version": API_VERSIONS.V1 },
  });

  assertEquals(isAtLeastVersion(reqV2, API_VERSIONS.V1), true);
  assertEquals(isAtLeastVersion(reqV2, API_VERSIONS.V2), true);
  assertEquals(isAtLeastVersion(reqV1, API_VERSIONS.V1), true);
  assertEquals(isAtLeastVersion(reqV1, API_VERSIONS.V2), false);
});
