import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes and resolves conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toContain("px-4");
    expect(cn("text-sm", "font-bold")).toContain("font-bold");
  });
});
