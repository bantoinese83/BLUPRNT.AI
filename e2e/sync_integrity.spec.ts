import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Sync Integrity Test (Cross-Platform / Realtime)
 * 
 * Verifies that data created "externally" (simulating a mobile app)
 * is instantly rendered on the web dashboard via Supabase Realtime.
 */
test.describe("Realtime Sync Integrity", () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://elucgaegaihkklnfoasm.supabase.co";
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
  
  // We use the service role if possible, but for this simulation, 
  // we'll just use the client to push an update that the UI should see.
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  test("Dashboard should reflect external project updates instantly", async ({ page }) => {
    // 1. Logic/Dashboard
    await page.goto("/dashboard");
    
    // 2. Identify an existing project ID or just wait for load
    // For this test, we'll wait for the dashboard to settle
    await page.waitForSelector("text=Projects");

    // 3. Get or Create a project ID
    let activeProjectId = await page.evaluate(() => localStorage.getItem("bluprnt_project_id"));
    
    if (!activeProjectId) {
      console.log("No active project found, creating one for test...");
      await page.evaluate(async () => {
        const sb = (window as any).supabase;
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const { data } = await sb.from("projects").insert({
          name: "Test Sync Project",
          user_id: user.id,
          remodel_type: "kitchen",
          status: "planning"
        }).select().single();
        if (data) {
          localStorage.setItem("bluprnt_project_id", data.id);
          window.location.reload();
        }
      });
      await page.waitForNavigation();
      activeProjectId = await page.evaluate(() => localStorage.getItem("bluprnt_project_id"));
    }

    if (!activeProjectId) throw new Error("Could not find or create a project for sync test");

    // 4. Simulate a change to this project name from "Mobile"
    const newName = `Updated Project ${Date.now()}`;
    
    // Note: This requires the session/JWT in the browser to have permission.
    await page.evaluate(async ({ id, name }) => {
      const sb = (window as any).supabase;
      await sb.from("projects").update({ name }).eq("id", id);
    }, { id: activeProjectId, name: newName });

    // 5. ASSERT: The UI should update the project name without a reload
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 10000 });
  });

  test("New invoices added externally should appear instantly", async ({ page }) => {
    await page.goto("/dashboard");
    let activeProjectId = await page.evaluate(() => localStorage.getItem("bluprnt_project_id"));
    
    // We already do creation logic in the previous test, but for isolation:
    if (!activeProjectId) {
      await page.locator("text=Projects").waitFor();
      activeProjectId = await page.evaluate(() => localStorage.getItem("bluprnt_project_id"));
    }
    
    if (!activeProjectId) return;

    const invoiceTotal = Math.floor(Math.random() * 5000) + 1000;
    const vendorName = `External Vendor ${Date.now()}`;

    // Insert invoice "from mobile"
    await page.evaluate(async ({ id, total, vendor }) => {
      const sb = (window as any).supabase;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      await sb.from("invoices").insert({
        project_id: id,
        vendor_name: vendor,
        total: total,
        document_type: "invoice",
        payment_status: "unpaid",
        issue_date: new Date().toISOString().slice(0, 10),
        invoice_number: `EXT-${Date.now()}`
      });
    }, { id: activeProjectId, total: invoiceTotal, vendor: vendorName });

    // ASSERT: Invoice appears in the "Recent Activity" or "Invoices" section
    await expect(page.locator(`text=${vendorName}`)).toBeVisible({ timeout: 10000 });
  });
});
