import { test, expect } from "@playwright/test";

test.describe("Project Management: Create, Rename, Delete", () => {
  test("full project lifecycle journey", async ({ page }) => {
    test.setTimeout(180_000);

    const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e.crud.${suffix}@example.com`;
    const password = `E2E-pw-${suffix}-9a`;

    // 1. Sign up
    await page.goto("/register");
    await page.locator("#register-policies").check();
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.locator("#register-zip").fill("90210");
    await page.getByRole("button", { name: "Create account" }).click();

    // 2. Wait for Dashboard (Default project "My home project")
    await page.waitForURL(/\/dashboard/i, { timeout: 60_000 });
    
    // Explicitly wait for the project header to appear, as the dashboard might show a skeleton first
    const projectDisplay = page.getByTestId("project-name-display");
    await projectDisplay.waitFor({ state: "visible", timeout: 30_000 });
    await expect(projectDisplay).toContainText("My home project");

    // 3. Rename Project
    await page.getByTestId("project-name-display").click();
    await page.getByTestId("project-rename-input").fill("Dream Kitchen Renovation");
    await page.getByTestId("project-rename-save").click();

    // Verify rename toast and UI update
    await expect(page.getByText("Project renamed successfully")).toBeVisible();
    await expect(page.getByTestId("project-name-display")).toContainText("Dream Kitchen Renovation");

    // 4. Open Switcher and Delete
    await page.getByTestId("project-switcher-toggle").click();
    await expect(page.getByTestId("project-option-Dream Kitchen Renovation")).toBeVisible();
    
    // The delete button is revealed on hover in CSS, but Playwright can click it directly if it's in the DOM
    await page.getByTestId("project-delete-Dream Kitchen Renovation").click();

    // Confirmation Modal
    await expect(page.getByText("Permanently remove project?")).toBeVisible();
    
    // Must type name to confirm
    await page.getByPlaceholder("Dream Kitchen Renovation").fill("Dream Kitchen Renovation");
    
    // Target the button specifically in the dialog to avoid ambiguity with the switcher's icons
    await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();

    // Verify success toast and redirection to empty state
    await expect(page.getByText("Project permanently removed")).toBeVisible();
    await expect(page.getByText("You’re all set")).toBeVisible(); // Empty state title
    await expect(page.getByText("Add a renovation project to see your estimate")).toBeVisible();
  });
});
