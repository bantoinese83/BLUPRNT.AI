import { invokeFunction } from "@/lib/supabase";
import type { LedgerEntryRow } from "@shared/types/database";
import { uint8ToBase64 } from "@shared/lib/uint8-to-base64";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing.js";

export type SellerPacketAppendixItem =
  | {
      title: string;
      kind: "image";
      dataUrl: string;
      imageFormat: "JPEG" | "PNG" | "WEBP";
    }
  | {
      title: string;
      kind: "pdf_note";
      noteLines: string[];
    };

/** Skip very large files so the PDF stays printable and fast. */
const MAX_BYTES_PER_FILE = 2_500_000;

type SignedUrlResponse = {
  signedUrl?: string;
  filename?: string;
  error?: string;
};

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

function appendixTitle(inv: LedgerEntryRow): string {
  const vendor = inv.vendor_name?.trim() || "Document";
  return `${formatDate(inv.created_at)} — ${vendor}`;
}

function mimeToJspdfFormat(
  mime: string,
  filename: string,
): "JPEG" | "PNG" | "WEBP" | null {
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m === "image/jpg") return "JPEG";
  if (m.includes("png")) return "PNG";
  if (m.includes("webp")) return "WEBP";
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPEG";
  if (lower.endsWith(".png")) return "PNG";
  if (lower.endsWith(".webp")) return "WEBP";
  return null;
}

function isProbablyPdf(mime: string, filename: string): boolean {
  if (mime.toLowerCase().includes("pdf")) return true;
  return filename.toLowerCase().endsWith(".pdf");
}

/**
 * Builds optional appendix pages: embeds image uploads; PDFs get a short note (no rasterization).
 */
export async function buildSellerPacketAppendixItems(
  ledgerEntries: LedgerEntryRow[],
): Promise<SellerPacketAppendixItem[]> {
  const withDocs = ledgerEntries.filter((i) => i.document_id);
  const items = await Promise.all(
    withDocs.map(async (inv): Promise<SellerPacketAppendixItem> => {
      const title = appendixTitle(inv);
      try {
        const { data, error } = await invokeFunction<SignedUrlResponse>(
          EDGE_FUNCTIONS.GET_DOCUMENT_SIGNED_URL,
          { body: { ledger_entry_id: inv.id } },
        );

        if (error || (data as SignedUrlResponse | null)?.error || !data) {
          return {
            title,
            kind: "pdf_note",
            noteLines: [
              "We couldn’t load this file for the appendix. You can still open it with View original in the app.",
            ],
          };
        }

        const signedUrl = (data as SignedUrlResponse).signedUrl;
        const filename = (data as SignedUrlResponse).filename ?? "document";

        if (!signedUrl) {
          return {
            title,
            kind: "pdf_note",
            noteLines: [
              "We couldn’t load this file for the appendix. Try View original in the app.",
            ],
          };
        }

        const response = await fetch(signedUrl);
        if (!response.ok) {
          return {
            title,
            kind: "pdf_note",
            noteLines: [
              "We couldn’t download this file. Try View original in the app.",
            ],
          };
        }

        const blob = await response.blob();
        if (blob.size > MAX_BYTES_PER_FILE) {
          return {
            title,
            kind: "pdf_note",
            noteLines: [
              `“${filename}” is too large to embed here (${Math.round(blob.size / 1_000_000)} MB).`,
              "Open the full original from the app with View original.",
            ],
          };
        }

        const mime = blob.type || "application/octet-stream";
        if (isProbablyPdf(mime, filename)) {
          return {
            title,
            kind: "pdf_note",
            noteLines: [
              `Original file: ${filename}`,
              "This upload is a PDF. It isn’t pasted into this export to keep the packet smaller. Open it with View original in the app.",
            ],
          };
        }

        const imageFormat = mimeToJspdfFormat(mime, filename);
        if (!imageFormat) {
          return {
            title,
            kind: "pdf_note",
            noteLines: [
              `Original file: ${filename}`,
              "This file type can’t be embedded in the PDF. Use View original in the app.",
            ],
          };
        }

        const buf = await blob.arrayBuffer();
        const dataUrl = `data:${mime};base64,${uint8ToBase64(new Uint8Array(buf))}`;

        return {
          title,
          kind: "image",
          dataUrl,
          imageFormat,
        };
      } catch (err) {
        console.error(`Error processing appendix item for ${title}:`, err);
        return {
          title,
          kind: "pdf_note",
          noteLines: [
            "An unexpected error occurred while processing this file for the appendix.",
          ],
        };
      }
    }),
  );

  return items;
}
