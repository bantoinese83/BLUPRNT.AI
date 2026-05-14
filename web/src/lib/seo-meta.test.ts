import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { seoAbsoluteUrl, seoCanonicalOrigin } from "./seo-meta";

describe("seoCanonicalOrigin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("prefers VITE_SITE_URL when set", () => {
    vi.stubEnv("VITE_SITE_URL", "https://prod.example.com/");
    expect(seoCanonicalOrigin()).toBe("https://prod.example.com");
  });

  it("falls back to window origin when env missing", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    vi.stubGlobal("window", { location: { origin: "http://localhost:4173" } });
    expect(seoCanonicalOrigin()).toBe("http://localhost:4173");
  });

  it("uses static fallback when env is empty and window is unavailable", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    const prev = globalThis.window;
    try {
      // @ts-expect-error — prerender / non-DOM environments
      delete globalThis.window;
      expect(seoCanonicalOrigin()).toBe("https://bluprnt.ai");
    } finally {
      globalThis.window = prev;
    }
  });
});

describe("seoAbsoluteUrl", () => {
  it("produces an absolute URL including the path", () => {
    const u = seoAbsoluteUrl("/login");
    expect(u).toMatch(/^https?:\/\//);
    expect(u).toContain("/login");
  });

  it("normalizes paths without a leading slash", () => {
    const u = seoAbsoluteUrl("terms");
    expect(u).toContain("/terms");
  });
});
