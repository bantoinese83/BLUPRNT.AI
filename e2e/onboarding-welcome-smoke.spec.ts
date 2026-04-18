import { test, expect } from "@playwright/test";
import { dismissOptionalCookies } from "./helpers/cookie-consent";

test.describe("Onboarding welcome (web)", () => {
  test("loads with trust copy aligned to shared privacy note", async ({
    page,
  }) => {
    const res = await page.goto("/onboarding");
    expect(res?.ok()).toBeTruthy();
    await dismissOptionalCookies(page);

    await expect(
      page.getByRole("heading", {
        name: /transform your renovation/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByText(/sell your contact info to contractors/i),
    ).toBeVisible();
  });
});
