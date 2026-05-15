import { test, expect } from "@playwright/test";

test.describe("Public routes", () => {
  test("login page loads", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { level: 1, name: /welcome back/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("privacy policy loads", async ({ page }) => {
    const res = await page.goto("/privacy");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("terms of service loads", async ({ page }) => {
    const res = await page.goto("/terms");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("register page loads", async ({ page }) => {
    const res = await page.goto("/register");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { level: 1, name: "Create account" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("forgot password page loads", async ({ page }) => {
    const res = await page.goto("/forgot-password");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("support page loads", async ({ page }) => {
    const res = await page.goto("/support");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { level: 1, name: /how can we help/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
