import { describe, expect, it } from "vitest";
import {
  classifyEstimateError,
  userFriendlyEstimateError,
} from "@/lib/onboarding-estimate-errors";

describe("onboarding estimate errors", () => {
  describe("classifyEstimateError", () => {
    it("classifies rate-limit errors", () => {
      expect(classifyEstimateError("429 too many requests")).toBe("rate_limit");
      expect(classifyEstimateError("Too Many Requests")).toBe("rate_limit");
    });

    it("classifies input errors", () => {
      expect(classifyEstimateError("400 Bad Request")).toBe("input");
      expect(classifyEstimateError("invalid input provided")).toBe("input");
    });

    it("classifies network errors", () => {
      expect(classifyEstimateError("network error")).toBe("network");
      expect(classifyEstimateError("failed to fetch")).toBe("network");
      expect(classifyEstimateError("connection reset")).toBe("network");
    });

    it("classifies safety errors", () => {
      expect(classifyEstimateError("image blocked by safety policy")).toBe(
        "safety",
      );
      expect(classifyEstimateError("unsafe content detected")).toBe("safety");
    });

    it("classifies server errors", () => {
      expect(classifyEstimateError("500 internal server error")).toBe("server");
      expect(classifyEstimateError("timed out waiting for response")).toBe(
        "server",
      );
      expect(classifyEstimateError("ai estimation failed")).toBe("server");
    });

    it("classifies unknown errors", () => {
      expect(classifyEstimateError("something went wrong")).toBe("unknown");
    });
  });

  describe("userFriendlyEstimateError", () => {
    it("returns correct message for rate_limit", () => {
      expect(userFriendlyEstimateError("429")).toContain("wait a moment");
    });

    it("returns correct message for input", () => {
      expect(userFriendlyEstimateError("invalid")).toContain("more detail");
    });

    it("returns correct message for network", () => {
      expect(userFriendlyEstimateError("network")).toContain(
        "connection and retry",
      );
    });

    it("returns correct message for safety", () => {
      expect(userFriendlyEstimateError("safety")).toContain(
        "could not be processed",
      );
    });

    it("returns correct message for server", () => {
      expect(userFriendlyEstimateError("500")).toContain(
        "estimate engine had trouble",
      );
    });

    it("returns default message for unknown", () => {
      expect(userFriendlyEstimateError("unknown")).toContain(
        "Please retry or continue",
      );
    });
  });
});
