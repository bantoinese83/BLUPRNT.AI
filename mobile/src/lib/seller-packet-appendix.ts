import { escapeHtml } from "./image-utils";
import { supabase } from "./supabase";
import type { InvoiceRow, ScopeRow } from "@shared/types/database";

/**
 * PDF Template Part: Appendix
 * Renders full-page images of original receipt uploads.
 */

function uint8ToBase64(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function buildSellerPacketAppendixHtml(
  invoices: (InvoiceRow & { storage_path?: string | null })[],
  _scopeItems?: ScopeRow[],
) {
  const images = invoices.filter(
    (inv) =>
      inv.storage_path &&
      (inv.storage_path.toLowerCase().endsWith(".jpg") ||
        inv.storage_path.toLowerCase().endsWith(".jpeg") ||
        inv.storage_path.toLowerCase().endsWith(".png") ||
        inv.storage_path.toLowerCase().endsWith(".pdf")),
  );

  if (images.length === 0) return "";

  // Parallel fetch and process all images to speed up generation
  const blocks = await Promise.all(
    images.map(async (inv) => {
      const title = `${inv.vendor_name || "Unknown Vendor"} — ${new Date(
        inv.issue_date || "",
      ).toLocaleDateString()}`;

      try {
        const { data, error } = await supabase.storage
          .from("project-documents")
          .download(inv.storage_path!);

        if (error || !data) throw error || new Error("No data");

        const blob = data as Blob;
        const mime = blob.type || "image/jpeg";

        if (mime === "application/pdf") {
          return `
            <div style="page-break-before: always; margin-top: 24px;">
              <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
              <p class="plan-line">This file type can’t be embedded. Use View original in the app.</p>
            </div>`;
        }

        const buf = await blob.arrayBuffer();
        const dataUrl = `data:${mime};base64,${uint8ToBase64(new Uint8Array(buf))}`;

        return `
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <img src="${dataUrl}" style="max-width: 100%; height: auto; margin-top: 12px;" alt="" />
          </div>`;
      } catch (_err) {
        return `
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">We couldn’t download this file.</p>
          </div>`;
      }
    }),
  );

  return `
    <div class="section">
      <h2 class="section-title">Appendix: Original uploads</h2>
      <p class="plan-line">Optional section. Image receipts appear below. PDFs are listed as notes only. Sharing may expose personal details from receipts.</p>
      ${blocks.join("")}
    </div>`;
}
