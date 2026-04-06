import { test, expect } from "@playwright/test";

test.describe("Public shell", () => {
  test("landing page responds", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
  });
});
