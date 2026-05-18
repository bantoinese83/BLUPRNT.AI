import { type Page } from "@playwright/test";
import { dismissOptionalCookies } from "./cookie-consent";

export async function signUpForE2E(page: Page) {
  const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e.test.${suffix}@example.com`;
  const password = `E2E-pw-${suffix}-9a`;

  await page.goto("/register");
  await dismissOptionalCookies(page);

  await page.locator("#register-policies").check();
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(password);
  await page.locator("#register-zip").fill("90210");

  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/dashboard/i, { timeout: 60_000 });

  return { email, password };
}
