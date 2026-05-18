import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LANDING_PAGE_TITLE,
  seoAbsoluteUrl,
  seoCanonicalOrigin,
  seoOgImageUrl,
  seoPageTitle,
} from "./seo-meta";

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
      expect(seoCanonicalOrigin()).toBe("https://www.bluprntai.com");
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

describe("seoOgImageUrl", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SITE_URL", "https://www.bluprntai.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns absolute OG image URL", () => {
    expect(seoOgImageUrl()).toBe("https://www.bluprntai.com/og-image.png");
  });
});

describe("seoPageTitle", () => {
  it("does not duplicate brand when title already includes BLUPRNT", () => {
    expect(seoPageTitle(LANDING_PAGE_TITLE)).toBe(LANDING_PAGE_TITLE);
  });

  it("appends brand for short page titles", () => {
    expect(seoPageTitle("Privacy Policy")).toBe("Privacy Policy — BLUPRNT.AI");
  });
});
