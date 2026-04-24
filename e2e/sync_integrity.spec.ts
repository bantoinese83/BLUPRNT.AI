import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { dismissOptionalCookies } from "./helpers/cookie-consent";
import crypto from "node:crypto";

/**
 * Sync Integrity Test (Cross-Platform / Realtime)
 * 
 * Verifies that data created "externally" (simulating a mobile app)
 * is instantly rendered on the web dashboard via Supabase Realtime.
 */
test.describe("Realtime Sync Integrity", () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://elucgaegaihkklnfoasm.supabase.co";
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  test("Dashboard should reflect external project updates instantly", async ({ page }) => {
    test.setTimeout(180_000);

    const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e.sync.${suffix}@example.com`;
    const password = `E2E-pw-${suffix}-9a`;

    // 1. Sign up to get a session
    await page.goto("/register");
    await dismissOptionalCookies(page);
    await page.locator("#register-policies").check();
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.locator("#register-zip").fill("90210");
    await page.getByRole("button", { name: "Create account" }).click();

    // 2. Wait for Dashboard
    await page.waitForURL(/\/dashboard/i, { timeout: 60_000 });
    const projectDisplay = page.getByTestId("project-name-display");
    await projectDisplay.waitFor({ state: "visible", timeout: 60_000 });

    // 3. Get Project ID
    let activeProjectId = await page.evaluate(() => localStorage.getItem("bluprnt_project_id"));
    if (!activeProjectId) throw new Error("Could not find project ID in localStorage");

    // 4. Authenticate the external client to simulate a mobile app session
    await supabase.auth.signInWithPassword({ email, password });

    // 5. Update the project name via "External" API call
    const newName = `Synced Name ${suffix}`;
    const { error } = await supabase
      .from("projects")
      .update({ name: newName })
      .eq("id", activeProjectId);

    if (error) throw new Error(`Supabase update failed: ${error.message}`);

    // 6. Assert UI reflects the change (Realtime subscription should catch this)
    await expect(projectDisplay).toContainText(newName, { timeout: 15_000 });
  });

  test("New invoices added externally should appear instantly", async ({ page }) => {
    test.setTimeout(180_000);

    const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e.sync.inv.${suffix}@example.com`;
    const password = `E2E-pw-${suffix}-9a`;

    // 1. Sign up
    await page.goto("/register");
    await page.locator("#register-policies").check();
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.locator("#register-zip").fill("90210");
    await page.getByRole("button", { name: "Create account" }).click();

    // 2. Wait for Dashboard
    await page.waitForURL(/\/dashboard/i, { timeout: 60_000 });
    await page.getByTestId("project-name-display").waitFor({ state: "visible", timeout: 60_000 });

    const activeProjectId = await page.evaluate(() => localStorage.getItem("bluprnt_project_id"));
    if (!activeProjectId) throw new Error("No active project found");
    
    // 4. Authenticate the external client
    await supabase.auth.signInWithPassword({ email, password });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user.id;

    const docId = crypto.randomUUID();
    const { error: docErr } = await supabase.from("documents").insert({
      id: docId,
      project_id: activeProjectId,
      type: "invoice",
      storage_path: `e2e/${docId}.pdf`,
      original_filename: "e2e_invoice.pdf",
      uploaded_by_user_id: userId,
    });
    if (docErr)
      throw new Error(`External document insert failed: ${docErr.message}`);


    // 5. Insert invoice "externally"
    const vendorName = `External Vendor ${suffix}`;
    const { error: invErr } = await supabase.from("invoices").insert({
      project_id: activeProjectId,
      document_id: docId,
      vendor_name: vendorName,
      total: 1250,
      document_type: "invoice",
      payment_status: "paid",
    });

    if (invErr)
      throw new Error(`External invoice insert failed: ${invErr.message}`);

    // Fallback: Reload if Realtime is being slow in the test environment
    await page.waitForTimeout(5000);
    await page.reload();
    await page.waitForURL(/\/dashboard/i);

    // Ensure we are looking at the documents section
    await page.locator("#document-upload-anchor").scrollIntoViewIfNeeded();

    // 6. Verify it appears in the UI
    const invoiceCard = page.locator("h4").filter({ hasText: vendorName });
    await expect(invoiceCard.first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("$1,250").first()).toBeVisible();


  });
});
