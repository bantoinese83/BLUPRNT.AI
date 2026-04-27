import { escapeHtml } from "./image-utils";
import { supabase } from "./supabase";
import type { LedgerEntryRow, ScopeRow } from "@shared/types/database";

/**
 * PDF Template Part: Appendix
 * Renders full-page images of original receipt uploads.
 */

/**
 * Inefficient for large arrays because of string concatenation.
 * Chunked conversion is much faster and memory-friendly.
 */
function uint8ToBase64(arr: Uint8Array): string {
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  let binary = "";
  for (let i = 0; i < arr.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(
      null,
      arr.subarray(i, i + CHUNK_SIZE) as unknown as number[],
    );
  }
  return btoa(binary);
}

export async function buildSellerPacketAppendixHtml(
  ledgerEntries: (LedgerEntryRow & { storage_path?: string | null })[],
  _scopeItems?: ScopeRow[],
) {
  const items = ledgerEntries.filter(
    (inv) =>
      inv.storage_path &&
      (inv.storage_path.toLowerCase().endsWith(".jpg") ||
        inv.storage_path.toLowerCase().endsWith(".jpeg") ||
        inv.storage_path.toLowerCase().endsWith(".png") ||
        inv.storage_path.toLowerCase().endsWith(".pdf")),
  );

  if (items.length === 0) return "";

  // Process images sequentially to avoid memory spikes and network congestion
  const blocks: string[] = [];
  for (const inv of items) {
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
        blocks.push(`
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">This file type can’t be embedded. Use View original in the app.</p>
          </div>`);
        continue;
      }

      const buf = await blob.arrayBuffer();
      const dataUrl = `data:${mime};base64,${uint8ToBase64(new Uint8Array(buf))}`;

      blocks.push(`
        <div style="page-break-before: always; margin-top: 24px;">
          <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
          <img src="${dataUrl}" style="max-width: 100%; height: auto; margin-top: 12px;" alt="" />
        </div>`);
    } catch (_err) {
      blocks.push(`
        <div style="page-break-before: always; margin-top: 24px;">
          <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
          <p class="plan-line">We couldn’t download this file.</p>
        </div>`);
    }
  }

  return `
    <div class="section">
      <h2 class="section-title">Appendix: Original uploads</h2>
      <p class="plan-line">Optional section. Image receipts appear below. PDFs are listed as notes only. Sharing may expose personal details from receipts.</p>
      ${blocks.join("")}
    </div>`;
}
