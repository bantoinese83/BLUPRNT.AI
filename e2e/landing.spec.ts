import { test, expect } from "@playwright/test";
import { dismissOptionalCookies } from "./helpers/cookie-consent";

test.describe("Landing smoke", () => {
  test("hero, trust line, and How it works anchor", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await dismissOptionalCookies(page);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /run your remodel like a pro/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole("button", { name: /start planning free/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /see how it works/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /create free account/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /add another renovation/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/not contractor lead lists/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /see how it works/i }).click();

    const howHeading = page.getByRole("heading", {
      level: 2,
      name: "How it works",
    });
    await expect(howHeading).toBeVisible({ timeout: 10_000 });
    await expect(howHeading).toBeInViewport();
  });
});
