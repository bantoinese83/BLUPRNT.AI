import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildWebPageJsonLd,
} from "./seo-json-ld";

describe("seo-json-ld", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SITE_URL", "https://bluprnt.ai");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("buildBreadcrumbListJsonLd includes absolute item URLs", () => {
    const data = buildBreadcrumbListJsonLd([
      { name: "Home", path: "/" },
      { name: "Privacy", path: "/privacy" },
    ]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(2);
    expect(data.itemListElement[1]?.item).toBe("https://bluprnt.ai/privacy");
  });

  it("buildFaqPageJsonLd maps questions", () => {
    const data = buildFaqPageJsonLd([{ question: "Q1?", answer: "A1." }]);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity[0]?.name).toBe("Q1?");
  });

  it("buildWebPageJsonLd includes breadcrumbs when provided", () => {
    const data = buildWebPageJsonLd({
      path: "/terms",
      name: "Terms",
      description: "Terms of service.",
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "Terms", path: "/terms" },
      ],
    });
    expect(data["@graph"]).toHaveLength(2);
    expect(data["@graph"][0]?.["@type"]).toBe("WebPage");
  });
});
