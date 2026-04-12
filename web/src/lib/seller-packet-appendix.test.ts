import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSellerPacketAppendixItems } from "./seller-packet-appendix";
import { invokeFunction } from "./supabase";
import type { InvoiceRow } from "@shared/types/database";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

function inv(partial: Partial<InvoiceRow> & { id: string }): InvoiceRow {
  const { id, ...rest } = partial;
  return {
    id,
    project_id: "p",
    vendor_name: "Vendor",
    total: 0,
    created_at: "2024-01-15T12:00:00.000Z",
    payment_status: "paid",
    document_type: "invoice",
    document_id: null,
    ...rest,
  } as InvoiceRow;
}

describe("buildSellerPacketAppendixItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("returns empty array when no invoices have documents", async () => {
    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: null }),
    ]);
    expect(items).toEqual([]);
  });

  it("adds pdf_note when invoke returns error", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("fail"),
    });
    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("pdf_note");
  });

  it("adds pdf_note when response body has error field", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "No original" },
      error: null,
    });
    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0].kind).toBe("pdf_note");
    expect(
      (items[0] as { noteLines: string[] }).noteLines.some((l) =>
        l.includes("couldn’t load this file"),
      ),
    ).toBe(true);
  });

  it("embeds jpeg when fetch returns small image blob", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/a.jpg", filename: "a.jpg" },
      error: null,
    });
    const blob = new Blob([new Uint8Array(100)], { type: "image/jpeg" });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);

    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("image");
    expect((items[0] as { imageFormat: string }).imageFormat).toBe("JPEG");
  });

  it("uses pdf_note for pdf blobs", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://cdn.example.com/a.pdf", filename: "a.pdf" },
      error: null,
    });
    const blob = new Blob([""], { type: "application/pdf" });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);

    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0].kind).toBe("pdf_note");
  });
});
