import { describe, it, expect } from "vitest";
import {
  estimateFallbackUserMessage,
  FALLBACK_REASON_AI_UNAVAILABLE,
  FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
} from "@shared/constants/onboarding";

describe("estimateFallbackUserMessage", () => {
  it("returns null when not a fallback", () => {
    expect(estimateFallbackUserMessage(false, null)).toBeNull();
    expect(estimateFallbackUserMessage(undefined, undefined)).toBeNull();
  });

  it("returns AI-unavailable copy by default when used_fallback is true", () => {
    const msg = estimateFallbackUserMessage(
      true,
      FALLBACK_REASON_AI_UNAVAILABLE,
    );
    expect(msg).toContain("full analysis");
  });

  it("returns client benchmark copy for client_type_benchmark", () => {
    const msg = estimateFallbackUserMessage(
      true,
      FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
    );
    expect(msg).toContain("benchmark");
  });
});
