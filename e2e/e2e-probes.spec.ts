import { test, expect } from "@playwright/test";

test.describe("E2E probes (VITE_E2E build)", () => {
  test("popup blocked: window.open returns null", async ({ page }) => {
    await page.addInitScript(() => {
      window.open = () => null;
    });
    await page.goto("/__e2e__/popup-probe");
    await expect(page.getByTestId("e2e-popup-probe-root")).toBeVisible({
      timeout: 15_000,
    });
    const blocked = await page.evaluate(
      () => document.documentElement.dataset.e2ePopupOpen === "blocked",
    );
    expect(blocked).toBe(true);
  });

  test("offline mid-save: fetch fails after going offline", async ({
    page,
    context,
  }) => {
    await page.goto("/__e2e__/offline-save");
    await expect(page.getByTestId("e2e-offline-save-trigger")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("e2e-offline-save-trigger").click();
    await expect(page.getByTestId("e2e-offline-save-status")).toHaveText("ok", {
      timeout: 15_000,
    });

    await context.setOffline(true);
    await page.getByTestId("e2e-offline-save-trigger").click();
    await expect(page.getByTestId("e2e-offline-save-status")).toHaveText(
      "offline",
      { timeout: 15_000 },
    );

    await context.setOffline(false);
  });
});
