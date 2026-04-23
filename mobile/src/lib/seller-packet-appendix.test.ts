import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildSellerPacketAppendixHtml } from "@/lib/seller-packet-appendix";
import { invokeFunction } from "@/lib/supabase";
import type { InvoiceRow } from "@shared/types/database";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

describe("buildSellerPacketAppendixHtml", () => {
  const baseInv: Pick<
    InvoiceRow,
    "id" | "document_id" | "vendor_name" | "created_at"
  > = {
    id: "inv-1",
    document_id: "doc-1",
    vendor_name: "Acme",
    created_at: "2025-01-15T12:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty string when no invoices have documents", async () => {
    const html = await buildSellerPacketAppendixHtml([
      { ...baseInv, document_id: null } as InvoiceRow,
    ]);
    expect(html).toBe("");
  });

  it("includes error block when signed URL fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("network"),
    });

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain("Appendix: Original uploads");
    expect(html).toContain("couldn’t load this file");
  });

  it("embeds small JPEG when fetch succeeds", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/r.jpg", filename: "r.jpg" },
      error: null,
    });

    const blob = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => blob,
      }),
    );

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain('src="data:image/jpeg;base64,');
    expect(html).toContain("<img ");
  });

  it("notes PDFs instead of embedding", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/r.pdf", filename: "r.pdf" },
      error: null,
    });

    const blob = new Blob([new Uint8Array(10)], { type: "application/pdf" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => blob,
      }),
    );

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain("PDFs aren’t pasted");
  });

  it("handles non-OK fetch response", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/r.jpg", filename: "r.jpg" },
      error: null,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        blob: async () => new Blob(),
      }),
    );

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain("couldn’t download");
  });

  it("handles fetch throw", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/r.jpg", filename: "r.jpg" },
      error: null,
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain("couldn’t download");
  });

  it("handles large blobs by showing a note", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: {
        signed_url: "https://cdn.example.com/big.jpg",
        filename: "big.jpg",
      },
      error: null,
    });
    const bigBlob = new Blob([new Uint8Array(3_000_000)], {
      type: "image/jpeg",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => bigBlob,
      }),
    );

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain("too large to embed");
  });

  it("handles unknown file types", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/r.zip", filename: "r.zip" },
      error: null,
    });
    const unknownBlob = new Blob([new Uint8Array(10)], {
      type: "application/zip",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => unknownBlob,
      }),
    );

    const html = await buildSellerPacketAppendixHtml([baseInv as InvoiceRow]);
    expect(html).toContain("can’t be embedded");
  });
});
