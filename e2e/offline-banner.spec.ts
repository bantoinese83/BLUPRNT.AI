import { test, expect } from "@playwright/test";

test.describe("Offline shell", () => {
  test("shows banner when browser goes offline", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.getByTestId("web-offline-banner")).toHaveCount(0);

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));

    await expect(page.getByTestId("web-offline-banner")).toContainText(
      /offline/i,
      { timeout: 5000 },
    );

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));

    await expect(page.getByTestId("web-offline-banner")).toHaveCount(0, {
      timeout: 5000,
    });
  });
});
