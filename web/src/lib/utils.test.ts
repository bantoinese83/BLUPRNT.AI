import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes and resolves conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toContain("px-4");
    expect(cn("px-2 py-1", "px-4")).not.toContain("px-2");
    expect(cn("text-sm", "font-bold")).toContain("font-bold");
  });

  it("handles conditional classes", () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn("a", isTrue && "b", isFalse && "c")).toBe("a b");
  });

  it("handles objects", () => {
    expect(cn({ a: true, b: false })).toBe("a");
  });

  it("handles undefined, null and empty strings", () => {
    expect(cn("a", undefined, null, "", "b")).toBe("a b");
  });

  it("handles arrays", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
