import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthCallbackUrl } from "./auth-redirect";

describe("getAuthCallbackUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses VITE_SITE_URL if provided", () => {
    vi.stubEnv("VITE_SITE_URL", "https://example.com/");
    expect(getAuthCallbackUrl()).toBe("https://example.com/auth/callback");
  });

  it("uses window.location.origin if VITE_SITE_URL is not provided", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    vi.stubGlobal("window", { location: { origin: "http://my-app.com" } });
    expect(getAuthCallbackUrl()).toBe("http://my-app.com/auth/callback");
  });

  it("defaults to localhost:3000 if nothing else is available", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    vi.stubGlobal("window", undefined);
    expect(getAuthCallbackUrl()).toBe("http://localhost:3000/auth/callback");
  });
});
