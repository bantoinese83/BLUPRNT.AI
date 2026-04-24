import { invokeFunction } from "@/lib/supabase";
import type { InvoiceRow } from "@shared/types/database";

const MAX_BYTES_PER_FILE = 2_500_000;

type SignedUrlResponse = {
  signed_url?: string;
  filename?: string;
  error?: string;
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appendixTitle(inv: InvoiceRow): string {
  const vendor = inv.vendor_name?.trim() || "Document";
  return `${formatDate(inv.created_at)} — ${vendor}`;
}

function isProbablyPdf(mime: string, filename: string): boolean {
  if (mime.toLowerCase().includes("pdf")) return true;
  return filename.toLowerCase().endsWith(".pdf");
}

function isImageMime(mime: string, filename: string): boolean {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return true;
  const lower = filename.toLowerCase();
  return /\.(jpe?g|png|webp)$/i.test(lower);
}

/**
 * HTML fragment for expo-print: optional appendix with embedded images or notes.
 */
export async function buildSellerPacketAppendixHtml(
  invoices: InvoiceRow[],
): Promise<string> {
  const withDocs = invoices.filter((i) => i.document_id);
  if (withDocs.length === 0) return "";

  const blocks: string[] = await Promise.all(
    withDocs.map(async (inv) => {
      const title = appendixTitle(inv);
      try {
        const { data, error } = await invokeFunction<SignedUrlResponse>(
          "get-document-signed-url",
          { body: { invoice_id: inv.id } },
        );

        if (error || (data as SignedUrlResponse | null)?.error || !data) {
          return `
            <div style="page-break-before: always; margin-top: 24px;">
              <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
              <p class="plan-line">We couldn’t load this file for the appendix. Use View original in the app.</p>
            </div>`;
        }

        const signedUrl = (data as SignedUrlResponse).signed_url;
        const filename = (data as SignedUrlResponse).filename ?? "document";

        if (!signedUrl) {
          return `
            <div style="page-break-before: always; margin-top: 24px;">
              <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
              <p class="plan-line">We couldn’t load this file for the appendix.</p>
            </div>`;
        }

        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error("Fetch failed");

        const blob = await response.blob();
        if (blob.size > MAX_BYTES_PER_FILE) {
          return `
            <div style="page-break-before: always; margin-top: 24px;">
              <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
              <p class="plan-line">${escapeHtml(filename)} is too large to embed (${Math.round(blob.size / 1_000_000)} MB). Open the original in the app.</p>
            </div>`;
        }

        const mime = blob.type || "application/octet-stream";
        if (isProbablyPdf(mime, filename)) {
          return `
            <div style="page-break-before: always; margin-top: 24px;">
              <h3 style="font-size: 16px;">${escapeHtml(title)}</h3>
              <p class="plan-line">${escapeHtml(`Original file: ${filename}`)}</p>
              <p class="plan-line">PDFs aren’t pasted into this export to keep the file smaller. Use View original in the app.</p>
            </div>`;
        }

        if (!isImageMime(mime, filename)) {
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
      } catch (err) {
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
