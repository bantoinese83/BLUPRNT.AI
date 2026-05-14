import { escapeHtml } from "@shared/lib/escape-html";
import { uint8ToBase64 } from "@shared/lib/uint8-to-base64";
import type { LedgerEntryRow } from "@shared/types/database";
import { fetchLedgerEntryOriginalSignedUrl } from "./open-original-document";

/** Skip very large files so the PDF stays printable and fast. */
const MAX_BYTES_PER_FILE = 2_500_000;

/**
 * PDF Template Part: Appendix
 * Renders full-page images of original receipt uploads.
 */
export async function buildSellerPacketAppendixHtml(
  ledgerEntries: LedgerEntryRow[],
) {
  const items = ledgerEntries.filter((inv) => Boolean(inv.document_id));

  if (items.length === 0) return "";

  // Process images sequentially to avoid memory spikes and network congestion
  const blocks: string[] = [];
  for (const inv of items) {
    const dateStr = inv.issue_date || inv.created_at || "";
    const title = `${inv.vendor_name || "Unknown Vendor"} — ${
      dateStr ? new Date(dateStr).toLocaleDateString() : "Document"
    }`;

    try {
      const res = await fetchLedgerEntryOriginalSignedUrl(inv.id);
      if (!res.ok) {
        blocks.push(`
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">We couldn’t load this file for the appendix. You can still open it with View original in the app.</p>
          </div>`);
        continue;
      }

      const response = await fetch(res.signedUrl);
      if (!response.ok) {
        blocks.push(`
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">We couldn’t download this file. Try View original in the app.</p>
          </div>`);
        continue;
      }

      const blob = await response.blob();
      const filename = res.filename || "document";

      if (blob.size > MAX_BYTES_PER_FILE) {
        blocks.push(`
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">“${escapeHtml(
              filename,
            )}” is too large to embed here (${Math.round(
              blob.size / 1_000_000,
            )} MB). Open the full original from the app with View original.</p>
          </div>`);
        continue;
      }

      const mime = blob.type || "image/jpeg";
      const lower = filename.toLowerCase();
      const isPdf = mime.includes("pdf") || lower.endsWith(".pdf");

      if (isPdf) {
        blocks.push(`
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">Original file: ${escapeHtml(filename)}</p>
            <p class="plan-line">This upload is a PDF. It isn’t pasted into this export to keep the packet smaller. Open it with View original in the app.</p>
          </div>`);
        continue;
      }

      const isImage =
        mime.includes("image") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp");

      if (!isImage) {
        blocks.push(`
          <div style="page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
            <p class="plan-line">Original file: ${escapeHtml(filename)}</p>
            <p class="plan-line">This file type can’t be embedded in the PDF. Use View original in the app.</p>
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
          <p class="plan-line">An unexpected error occurred while processing this file for the appendix.</p>
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
