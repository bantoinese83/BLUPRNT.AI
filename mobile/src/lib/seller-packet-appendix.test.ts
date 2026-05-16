import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildSellerPacketAppendixHtml } from "./seller-packet-appendix";
import { fetchLedgerEntryOriginalSignedUrl } from "./open-original-document";

vi.mock("./open-original-document", () => ({
  fetchLedgerEntryOriginalSignedUrl: vi.fn(),
}));

describe("buildSellerPacketAppendixHtml", () => {
  const getBaseInv = () => ({
    id: "inv-1",
    document_id: "doc-1",
    vendor_name: "Acme",
    issue_date: "2025-01-15T12:00:00.000Z",
    created_at: "2025-01-15T12:00:00.000Z",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Mock FileReader for Node environment
    global.FileReader = class {
      onloadend: () => void = () => {};
      onerror: () => void = () => {};
      result: string = "data:image/jpeg;base64,AAAA";
      readAsDataURL() {
        setTimeout(() => {
          this.onloadend();
        }, 0);
      }
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty string when no invoices have documents", async () => {
    const html = await buildSellerPacketAppendixHtml([
      { ...getBaseInv(), document_id: null } as any,
    ]);
    expect(html).toBe("");
  });

  it("includes error block when signed URL fetch fails", async () => {
    vi.mocked(fetchLedgerEntryOriginalSignedUrl).mockResolvedValue({
      ok: false,
      message: "network",
    });

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("Appendix: Original uploads");
    expect(html).toContain("couldn’t load this file");
  });

  it("embeds small JPEG when download succeeds", async () => {
    vi.mocked(fetchLedgerEntryOriginalSignedUrl).mockResolvedValue({
      ok: true,
      signedUrl: "https://example.com/file.jpg",
      filename: "file.jpg",
    });
    const blob = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain('src="data:image/jpeg;base64,');
    expect(html).toContain("<img ");
  });

  it("notes PDFs instead of embedding", async () => {
    vi.mocked(fetchLedgerEntryOriginalSignedUrl).mockResolvedValue({
      ok: true,
      signedUrl: "https://example.com/file.pdf",
      filename: "file.pdf",
    });
    const blob = new Blob([new Uint8Array(10)], { type: "application/pdf" });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("This upload is a PDF");
  });

  it("handles non-OK download result", async () => {
    vi.mocked(fetchLedgerEntryOriginalSignedUrl).mockResolvedValue({
      ok: true,
      signedUrl: "https://example.com/file.jpg",
      filename: "file.jpg",
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      blob: async () => new Blob(),
    } as Response);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("couldn’t download this file");
  });

  it("handles download throw", async () => {
    vi.mocked(fetchLedgerEntryOriginalSignedUrl).mockResolvedValue({
      ok: true,
      signedUrl: "https://example.com/file.jpg",
      filename: "file.jpg",
    });
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("An unexpected error occurred");
  });

  it("handles unknown file types by noting they can't be embedded", async () => {
    vi.mocked(fetchLedgerEntryOriginalSignedUrl).mockResolvedValue({
      ok: true,
      signedUrl: "https://example.com/file.zip",
      filename: "file.zip",
    });
    const unknownBlob = new Blob([new Uint8Array(10)], {
      type: "application/zip",
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => unknownBlob,
    } as Response);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("type can’t be embedded");
  });
});
