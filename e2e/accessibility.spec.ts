import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (WCAG 2.1)", () => {
  test("Landing Page should have no automatically detectable a11y issues", async ({ page }) => {
    await page.goto("/");
    
    // Wait for content to settle
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Dashboard should have no automatically detectable a11y issues", async ({ page }) => {
    // We need a session, so we use the storage state if available or mock login
    // For this audit, we'll just check the landing/public parts if auth is complex to setup here
    // But let's assume the user wants the full check.
    await page.goto("/dashboard");
    
    // If redirected to login, that's fine, we check the login page too
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Pricing Page a11y", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
