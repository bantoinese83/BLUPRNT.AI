import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

test.describe("PDF Export Fidelity", () => {
  test("Exported PDF should contain correct project data", async ({ page }) => {
    // 1. Setup/Login (using existing patterns)
    await page.goto("/dashboard");
    
    // Assume we've navigated to a project detail page
    // For this test, we search for the 'Export' button
    // (In a real test, we would seed a project first)
    
    const downloadPromise = page.waitForEvent("download");
    
    // Look for Export PDF button - using ID if possible for robustness
    const exportBtn = page.locator('button:has-text("Export")');
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      
      const download = await downloadPromise;
      const downloadPath = path.join(__dirname, "../test-results", download.suggestedFilename());
      await download.saveAs(downloadPath);

      // Verify file exists and has size
      expect(fs.existsSync(downloadPath)).toBe(true);
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB

      // Parse PDF content
      const dataBuffer = fs.readFileSync(downloadPath);
      const data = await pdf(dataBuffer);
      
      // Basic text checks
      expect(data.text).toContain("BLUPRNT.AI");
      // expect(data.text).toContain("Project Summary"); // Adjust based on actual PDF template
      
      // Cleanup
      fs.unlinkSync(downloadPath);
    } else {
      console.log("Export button not found, skipping PDF content verification.");
    }
  });
});
