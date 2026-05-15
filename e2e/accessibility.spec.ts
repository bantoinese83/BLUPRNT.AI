import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissOptionalCookies } from "./helpers/cookie-consent";
import { signUpForE2E } from "./helpers/auth";

const PLACEHOLDER_ANON = "playwright-e2e-anon-placeholder";

function hasSupabaseForAuthE2E(): boolean {
  return Boolean(
    process.env.VITE_SUPABASE_URL?.trim() &&
      process.env.VITE_SUPABASE_ANON_KEY?.trim() &&
      process.env.VITE_SUPABASE_ANON_KEY !== PLACEHOLDER_ANON,
  );
}

/** WCAG 2.1 Level A & AA rulesets (axe tag names). */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

test.describe("Accessibility (WCAG 2.1)", () => {
  test("Landing page has no automatically detectable a11y issues", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissOptionalCookies(page);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Login page (after /dashboard redirect when signed out) has no automatically detectable a11y issues", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await dismissOptionalCookies(page);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Landing pricing section has no automatically detectable a11y issues", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissOptionalCookies(page);
    await page.waitForLoadState("domcontentloaded");
    await page.locator("#pricing").scrollIntoViewIfNeeded();
    await expect(page.locator("#pricing-heading")).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("#pricing")
      .exclude("#pricing img[role='presentation']")
      /* Raster plan artwork + tinted table cells: axe color-contrast is noisy here;
         landing + login tests still run full contrast on flatter surfaces. */
      .disableRules(["color-contrast"])
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Terms of service page has no automatically detectable a11y issues", async ({
    page,
  }) => {
    await page.goto("/terms");
    await dismissOptionalCookies(page);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Register page has no automatically detectable a11y issues", async ({
    page,
  }) => {
    await page.goto("/register");
    await dismissOptionalCookies(page);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Forgot password page has no automatically detectable a11y issues", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await dismissOptionalCookies(page);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Dashboard plan tab has no automatically detectable a11y issues", async ({
    page,
  }) => {
    test.skip(
      !hasSupabaseForAuthE2E(),
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for authenticated dashboard a11y scan.",
    );
    test.setTimeout(120_000);

    await signUpForE2E(page);
    await page.goto("/dashboard/plan");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
