import { test, expect } from "@playwright/test";
import { dismissOptionalCookies } from "./helpers/cookie-consent";

const PLACEHOLDER_ANON = "playwright-e2e-anon-placeholder";

test.describe("Auth: signup to dashboard", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.VITE_SUPABASE_URL?.trim() ||
        !process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
        process.env.VITE_SUPABASE_ANON_KEY === PLACEHOLDER_ANON,
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a root .env (or export them). CI placeholder skips this flow. Turn off “Confirm email” in Supabase Auth for instant session after signUp.",
    );
  });

  test("registers with password and lands on dashboard", async ({ page }) => {
    test.setTimeout(120_000);

    const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e.signup.${suffix}@example.com`;
    const password = `E2E-pw-${suffix}-9a`;

    await page.goto("/register");
    await dismissOptionalCookies(page);

    await page.locator("#register-policies").check();

    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.locator("#register-zip").fill("90210");

    await page.getByRole("button", { name: "Create account" }).click();

    const dashboardNav = page.waitForURL(/\/dashboard/i, { timeout: 100_000 });
    const alertVisible = page
      .getByRole("alert")
      .waitFor({ state: "visible", timeout: 100_000 })
      .then(async () => {
        const msg = (await page.getByRole("alert").innerText()).trim();
        throw new Error(
          msg ||
            "Sign-up failed (see register page alert). With email confirmation off, check Supabase URL/key, RLS on properties/projects, and network.",
        );
      });
    await Promise.race([dashboardNav, alertVisible]);

    await expect(
      page.getByTestId("project-name-display"),
    ).toBeVisible({ timeout: 60_000 });

    await expect(
      page.getByRole("heading", { name: "My home project" }),
    ).toBeVisible({
      timeout: 60_000,
    });
  });
});
