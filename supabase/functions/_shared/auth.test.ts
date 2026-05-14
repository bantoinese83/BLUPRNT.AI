import { assertEquals } from "std/assert";
import {
  isBearerServiceRoleKey,
  timingSafeEqualUtf8,
} from "./auth.ts";

Deno.test("timingSafeEqualUtf8 - equal strings", () => {
  assertEquals(timingSafeEqualUtf8("abc", "abc"), true);
});

Deno.test("timingSafeEqualUtf8 - length mismatch", () => {
  assertEquals(timingSafeEqualUtf8("a", "ab"), false);
});

Deno.test("timingSafeEqualUtf8 - different same length", () => {
  assertEquals(timingSafeEqualUtf8("abc", "abd"), false);
});

Deno.test("isBearerServiceRoleKey - exact Bearer match", () => {
  const key = "s" + "r".repeat(20) + "_secret_example";
  assertEquals(
    isBearerServiceRoleKey(`Bearer ${key}`, key),
    true,
  );
});

Deno.test("isBearerServiceRoleKey - rejects substring in longer header", () => {
  const key = "only_this_part";
  assertEquals(
    isBearerServiceRoleKey(`Bearer prefix_${key}_suffix`, key),
    false,
  );
});

Deno.test("isBearerServiceRoleKey - rejects includes() style forgery", () => {
  const key = "real-service-key";
  assertEquals(
    isBearerServiceRoleKey(`Bearer not-${key}-but-contains`, key),
    false,
  );
});

Deno.test("isBearerServiceRoleKey - trims header and key", () => {
  const key = "trimmed-key";
  assertEquals(isBearerServiceRoleKey(`  Bearer ${key}  `, `  ${key}  `), true);
});

Deno.test("isBearerServiceRoleKey - missing or empty", () => {
  assertEquals(isBearerServiceRoleKey(null, "k"), false);
  assertEquals(isBearerServiceRoleKey("Bearer k", null), false);
  assertEquals(isBearerServiceRoleKey("Bearer k", ""), false);
});
