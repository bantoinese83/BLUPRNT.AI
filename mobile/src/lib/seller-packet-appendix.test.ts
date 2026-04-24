import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildSellerPacketAppendixHtml } from "@/lib/seller-packet-appendix";
import { supabase } from "@/lib/supabase";

vi.mock("./supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      download: vi.fn(),
    },
  },
  invokeFunction: vi.fn(),
}));

describe("buildSellerPacketAppendixHtml", () => {
  const getBaseInv = () => ({
    id: "inv-1",
    document_id: "doc-1",
    vendor_name: "Acme",
    issue_date: "2025-01-15T12:00:00.000Z",
    created_at: "2025-01-15T12:00:00.000Z",
    storage_path: "receipt.jpg",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty string when no invoices have documents", async () => {
    const html = await buildSellerPacketAppendixHtml([
      { ...getBaseInv(), storage_path: null } as any,
    ]);
    expect(html).toBe("");
  });

  it("includes error block when download fails", async () => {
    vi.mocked(supabase.storage.download).mockResolvedValue({
      data: null,
      error: new Error("network"),
    } as any);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("Appendix: Original uploads");
    expect(html).toContain("couldn’t download");
  });

  it("embeds small JPEG when download succeeds", async () => {
    const blob = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
    vi.mocked(supabase.storage.download).mockResolvedValue({
      data: blob,
      error: null,
    } as any);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain('src="data:image/jpeg;base64,');
    expect(html).toContain("<img ");
  });

  it("notes PDFs instead of embedding", async () => {
    const blob = new Blob([new Uint8Array(10)], { type: "application/pdf" });
    vi.mocked(supabase.storage.download).mockResolvedValue({
      data: blob,
      error: null,
    } as any);

    const pdfInv = { ...getBaseInv(), storage_path: "receipt.pdf" };
    const html = await buildSellerPacketAppendixHtml([pdfInv as any]);
    expect(html).toContain("type can’t be embedded");
  });

  it("handles non-OK download result", async () => {
    vi.mocked(supabase.storage.download).mockResolvedValue({
      data: null,
      error: new Error("download error"),
    } as any);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("couldn’t download");
  });

  it("handles download throw", async () => {
    vi.mocked(supabase.storage.download).mockRejectedValue(
      new Error("offline"),
    );

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("couldn’t download");
  });

  it("handles unknown file types by noting they can't be embedded", async () => {
    const unknownBlob = new Blob([new Uint8Array(10)], {
      type: "application/zip",
    });
    vi.mocked(supabase.storage.download).mockResolvedValue({
      data: unknownBlob,
      error: null,
    } as any);

    const html = await buildSellerPacketAppendixHtml([getBaseInv() as any]);
    expect(html).toContain("<img ");
  });
});
