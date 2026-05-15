import { test, expect, type Page } from "@playwright/test";
import { dismissOptionalCookies } from "./helpers/cookie-consent";
import {
  PUBLIC_SITE_ORIGIN,
  WEB_APP_PATH_SUPPORT,
} from "../shared/constants/public-site";

/** react-helmet-async tags; static tags from index.html are ignored in assertions. */
function helmetMeta(page: Page, name: string) {
  return page.locator(`meta[data-rh="true"][name="${name}"]`);
}

function helmetLink(page: Page, rel: string) {
  return page.locator(`link[data-rh="true"][rel="${rel}"]`);
}

test.describe("Public page SEO", () => {
  test("/support exposes indexable head tags and FAQ JSON-LD", async ({
    page,
  }) => {
    const res = await page.goto(WEB_APP_PATH_SUPPORT);
    expect(res?.ok()).toBeTruthy();
    await dismissOptionalCookies(page);

    await expect(page).toHaveTitle(/Help & Support — BLUPRNT\.AI/i);

    await expect(helmetMeta(page, "description")).toHaveAttribute(
      "content",
      /help with BLUPRNT estimates/i,
    );

    await expect(helmetMeta(page, "robots")).toHaveAttribute(
      "content",
      /index,\s*follow/i,
    );

    const canonicalHref = await helmetLink(page, "canonical").getAttribute(
      "href",
    );
    expect(canonicalHref).toBeTruthy();
    expect(new URL(canonicalHref!).pathname).toBe(WEB_APP_PATH_SUPPORT);

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(2);

    const types = await jsonLd.evaluateAll((nodes) => {
      const collect = (value: unknown): string[] => {
        if (!value || typeof value !== "object") return [];
        const record = value as Record<string, unknown>;
        const found: string[] = [];
        if (typeof record["@type"] === "string") found.push(record["@type"]);
        if (Array.isArray(record["@graph"])) {
          for (const item of record["@graph"]) {
            found.push(...collect(item));
          }
        }
        return found;
      };
      return nodes.flatMap((node) =>
        collect(JSON.parse(node.textContent ?? "{}")),
      );
    });
    expect(types).toContain("FAQPage");
    expect(types).toContain("ContactPage");

    await expect(
      page.getByRole("heading", { level: 1, name: /how can we help/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("unknown routes use noindex and a descriptive title", async ({
    page,
  }) => {
    const res = await page.goto("/route-that-does-not-exist-e2e");
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/Page Not Found — BLUPRNT\.AI/i);

    await expect(helmetMeta(page, "robots")).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );

    await expect(helmetMeta(page, "description")).toHaveAttribute(
      "content",
      /does not exist on BLUPRNT/i,
    );

    await expect(helmetLink(page, "canonical")).toHaveCount(0);

    await expect(
      page.getByRole("heading", { level: 1, name: /lost your way/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("/privacy canonical path matches the public route", async ({ page }) => {
    await page.goto("/privacy");
    const canonicalHref = await helmetLink(page, "canonical").getAttribute(
      "href",
    );
    expect(canonicalHref).toBeTruthy();
    expect(new URL(canonicalHref!).pathname).toBe("/privacy");
    // Production builds use bluprnt.ai; e2e preview may use localhost/127.0.0.1.
    expect(PUBLIC_SITE_ORIGIN).toBe("https://bluprnt.ai");
  });
});
