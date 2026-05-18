import { test, expect } from "@playwright/test";
import { dismissOptionalCookies } from "./helpers/cookie-consent";

test.describe("Auth redirect & URL errors", () => {
  test("login shows friendly message from error query param", async ({
    page,
  }) => {
    await page.goto(
      `/login?error=${encodeURIComponent("Invalid login credentials")}`,
    );
    await dismissOptionalCookies(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /welcome back/i }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("alert")).toContainText(
      /That email or password/i,
    );
  });

  test("login page accepts redirect query without breaking", async ({
    page,
  }) => {
    const res = await page.goto(
      `/login?redirect=${encodeURIComponent("/onboarding?newProject=1")}`,
    );
    expect(res?.ok()).toBeTruthy();
    await dismissOptionalCookies(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /welcome back/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("landing Add another renovation goes to login with redirect", async ({
    page,
  }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await dismissOptionalCookies(page);

    await page.getByRole("button", { name: /add another renovation/i }).click();

    await expect(page).toHaveURL(/\/login\?redirect=/, { timeout: 15_000 });
    const url = new URL(page.url());
    const redirect = url.searchParams.get("redirect");
    expect(redirect).toBeTruthy();
    expect(decodeURIComponent(redirect!)).toContain("/onboarding");
  });
});
