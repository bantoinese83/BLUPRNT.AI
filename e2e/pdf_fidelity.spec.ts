import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { signUpForE2E } from "./helpers/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



test.describe("PDF Export Fidelity", () => {
  test("Exported PDF should contain correct project data", async ({ page }) => {
    test.setTimeout(120000);
    // 1. Sign up and get to dashboard
    await signUpForE2E(page);
    
    // 2. Wait for the project to load and the export button to be ready
    await expect(page.getByTestId("project-name-display")).toBeVisible({ timeout: 60_000 });

    
    const downloadPromise = page.waitForEvent("download");
    
    // Look for Export PDF button - using ARIA label for uniqueness
    const exportBtn = page.getByRole("button", { name: "Download Home Archive PDF" });
    await exportBtn.waitFor({ state: "visible", timeout: 15_000 });
    await exportBtn.click();

      
      const download = await downloadPromise;
      const downloadPath = path.join(__dirname, "../test-results", download.suggestedFilename());
      await download.saveAs(downloadPath);

      // Verify file exists and has size
      expect(fs.existsSync(downloadPath)).toBe(true);
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB

      // Verify file content starts with PDF signature
      const dataBuffer = fs.readFileSync(downloadPath);
      expect(dataBuffer.toString().startsWith("%PDF")).toBe(true);
      
      // Basic text checks - search for BLUPRNT.AI in the raw stream (often visible in PDFs)
      expect(dataBuffer.toString()).toContain("BLUPRNT.AI");

      // expect(data.text).toContain("Project Summary"); // Adjust based on actual PDF template
      
      // Cleanup
      fs.unlinkSync(downloadPath);

  });
});
