import { test, expect } from "@playwright/test";

test.describe("Shared project (ProjectView)", () => {
  test("shows expired message when API returns 410", async ({ page }) => {
    await page.route("**/functions/v1/get-project-view**", async (route) => {
      await route.fulfill({
        status: 410,
        contentType: "application/json",
        body: JSON.stringify({ error: "Link expired" }),
      });
    });

    const res = await page.goto("/project/expired-token-e2e");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByText(/This link has expired/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows not found message when API returns 404", async ({ page }) => {
    await page.route("**/functions/v1/get-project-view**", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "not found" }),
      });
    });

    await page.goto("/project/missing-token-e2e");

    await expect(
      page.getByText(/couldn’t find that shared project/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
