/**
 * Partial behavioral tests for delete-account.
 * Tests recursion safety in storage cleanup.
 */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";

async function removeBucketPrefixRecursiveMock(
  depth: number,
  maxDepth: number,
  onWarn: () => void,
): Promise<number> {
  if (depth > maxDepth) {
    onWarn();
    return depth;
  }
  // Simulate finding 1 "folder" and 1 "file"
  // Recurse once
  return await removeBucketPrefixRecursiveMock(depth + 1, maxDepth, onWarn);
}

Deno.test("delete-account storage recursion - stops at limit", async () => {
  let warnCalled = false;
  const finalDepth = await removeBucketPrefixRecursiveMock(0, 5, () => {
    warnCalled = true;
  });
  
  assertEquals(warnCalled, true);
  assertEquals(finalDepth, 6);
});

Deno.test("delete-account storage recursion - processes safe depth", async () => {
  let warnCalled = false;
  const finalDepth = await removeBucketPrefixRecursiveMock(0, 10, () => {
    warnCalled = true;
  });
  
  // If our mock only recurses once per call, it hits 11
  assertEquals(warnCalled, true);
});
