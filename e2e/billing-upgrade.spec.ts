import { test, expect } from "@playwright/test";
import { signUpForE2E } from "./helpers/auth";

test.describe("Billing & Upgrades", () => {
  test.setTimeout(120_000);
  test.beforeEach(async ({ page }) => {
    // Skip if no local Supabase
    test.skip(
      !process.env.VITE_SUPABASE_URL ||
        (!process.env.VITE_SUPABASE_URL.includes("127.0.0.1") &&
          !process.env.VITE_SUPABASE_URL.includes("localhost")),
      "Set VITE_SUPABASE_URL to local Supabase (supabase start) so signup + billing UI run without real Stripe or prod data.",
    );
    await signUpForE2E(page);
  });

  test("opens upgrade modal from dashboard", async ({ page }) => {
    // Wait for dashboard content
    await expect(page.getByRole("heading", { name: "My home project" })).toBeVisible();

    // Click Upgrade in the header
    await page.getByRole("button", { name: /Upgrade/i }).click();

    // Check if modal is visible
    await expect(page.getByText("Unlock Architect features")).toBeVisible();
    await expect(page.getByRole("button", { name: /Upgrade to Architect/i })).toBeVisible();
    
    // Close modal
    await page.keyboard.press("Escape");
    await expect(page.getByText("Unlock Architect features")).not.toBeVisible();
  });

  test("opens upgrade modal from settings", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Click Upgrade Now in the billing card
    await page.getByRole("button", { name: "Upgrade Now" }).click();

    // Check if modal is visible
    await expect(page.getByText("Unlock Architect features")).toBeVisible();
    
    // Close modal
    await page.getByRole("button", { name: /Close/i }).or(page.locator("button:has-text('Cancel')")).first().click();
  });
});
