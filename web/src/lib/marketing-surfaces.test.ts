import { describe, it, expect } from "vitest";
import {
  isHelpWidgetHiddenPath,
  isHeavyGlobalChromeDeferredPath,
} from "./marketing-surfaces";

describe("isHelpWidgetHiddenPath", () => {
  it("hides on home and auth-related routes", () => {
    expect(isHelpWidgetHiddenPath("/")).toBe(true);
    expect(isHelpWidgetHiddenPath("/login")).toBe(true);
    expect(isHelpWidgetHiddenPath("/register")).toBe(true);
    expect(isHelpWidgetHiddenPath("/forgot-password")).toBe(true);
    expect(isHelpWidgetHiddenPath("/signed-out")).toBe(true);
    expect(isHelpWidgetHiddenPath("/auth/callback")).toBe(true);
    expect(isHelpWidgetHiddenPath("/onboarding")).toBe(true);
    expect(isHelpWidgetHiddenPath("/onboarding/step")).toBe(true);
  });

  it("shows help widget on typical app routes", () => {
    expect(isHelpWidgetHiddenPath("/dashboard")).toBe(false);
    expect(isHelpWidgetHiddenPath("/project/abc")).toBe(false);
  });
});

describe("isHeavyGlobalChromeDeferredPath", () => {
  it("defers only on home", () => {
    expect(isHeavyGlobalChromeDeferredPath("/")).toBe(true);
    expect(isHeavyGlobalChromeDeferredPath("/login")).toBe(false);
  });
});
