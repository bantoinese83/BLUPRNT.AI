import type { Page } from "@playwright/test";

/** Dismisses the optional analytics cookie prompt so it does not intercept clicks. */
export async function dismissOptionalCookies(page: Page): Promise<void> {
  const btn = page.getByRole("button", { name: "Reject Optional" });
  try {
    await btn.click({ timeout: 4000 });
  } catch {
    /* banner absent or already dismissed */
  }
}
