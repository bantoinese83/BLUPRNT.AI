import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getPublicSiteUrl, buildLandingJsonLd, LANDING_FAQ } from "./site-url";

describe("getPublicSiteUrl", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns VITE_SITE_URL if defined", () => {
    vi.stubEnv("VITE_SITE_URL", "https://example.com");
    expect(getPublicSiteUrl()).toBe("https://example.com");
  });

  it("trims trailing slash from VITE_SITE_URL", () => {
    vi.stubEnv("VITE_SITE_URL", "https://example.com/");
    expect(getPublicSiteUrl()).toBe("https://example.com");
  });

  it("falls back to window.location.origin if VITE_SITE_URL is missing", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    const originalLocation = window.location;
    // @ts-expect-error: Mocking window.location
    delete window.location;
    window.location = {
      ...originalLocation,
      origin: "https://local.test",
    } as any;

    expect(getPublicSiteUrl()).toBe("https://local.test");

    (window as any).location = originalLocation;
  });

  it("returns empty string if neither VITE_SITE_URL nor window is available", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    const originalWindow = global.window;
    // @ts-expect-error: Mocking global window
    delete global.window;

    expect(getPublicSiteUrl()).toBe("");

    global.window = originalWindow;
  });
});

describe("buildLandingJsonLd", () => {
  it("verifies structure and inclusion of all FAQs", () => {
    const siteUrl = "https://bluprnt.ai";
    const jsonLd = buildLandingJsonLd(siteUrl);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(Array.isArray(jsonLd["@graph"])).toBe(true);

    const faqPage = jsonLd["@graph"].find(
      (item) => item["@type"] === "FAQPage",
    );
    expect(faqPage).toBeDefined();
    expect(faqPage?.mainEntity).toHaveLength(LANDING_FAQ.length);

    LANDING_FAQ.forEach((faq, index) => {
      expect(faqPage?.mainEntity![index].name).toBe(faq.question);
      expect(faqPage?.mainEntity![index].acceptedAnswer.text).toBe(faq.answer);
    });

    const webSite = jsonLd["@graph"].find(
      (item) => item["@type"] === "WebSite",
    );
    expect(webSite?.url).toBe(siteUrl);

    const organization = jsonLd["@graph"].find(
      (item) => item["@type"] === "Organization",
    );
    expect(organization?.url).toBe(siteUrl);
    expect(organization?.logo!.url).toBe(`${siteUrl}/bluprnt_logo.svg`);
  });
});
