import { describe, expect, it } from "vitest";
import {
  classifyEstimateError,
  userFriendlyEstimateError,
} from "@/lib/onboarding-estimate-errors";

describe("onboarding estimate errors", () => {
  it("classifies rate-limit errors", () => {
    expect(classifyEstimateError("429 too many requests")).toBe("rate_limit");
  });

  it("classifies safety errors", () => {
    expect(classifyEstimateError("image blocked by safety policy")).toBe("safety");
  });

  it("returns user-friendly copy", () => {
    expect(userFriendlyEstimateError("failed to fetch")).toContain("connection");
  });
});
