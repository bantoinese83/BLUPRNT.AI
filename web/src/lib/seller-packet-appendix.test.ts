import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSellerPacketAppendixItems } from "./seller-packet-appendix";
import { invokeFunction } from "./supabase";
import type { LedgerEntryRow } from "@shared/types/database";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

function inv(
  partial: Partial<LedgerEntryRow> & { id: string },
): LedgerEntryRow {
  const { id, ...rest } = partial;
  return {
    id,
    project_id: "p",
    vendor_name: "Vendor",
    total: 0,
    created_at: "2024-01-15T12:00:00.000Z",
    payment_status: "paid",
    document_type: "invoice",
    document_id: "00000000-0000-0000-0000-000000000000",
    ...rest,
  } as LedgerEntryRow;
}

describe("buildSellerPacketAppendixItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("returns empty array when no invoices are provided", async () => {
    const items = await buildSellerPacketAppendixItems([]);
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
    expect(items[0]!.kind).toBe("pdf_note");
  });

  it("adds pdf_note when response body has error field", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "No original" },
      error: null,
    });
    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0]!.kind).toBe("pdf_note");
    expect(
      (items[0] as { noteLines: string[] }).noteLines.some((l) =>
        l.includes("couldn’t load this file"),
      ),
    ).toBe(true);
  });

  it("embeds jpeg when fetch returns small image blob", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://cdn.example.com/a.jpg", filename: "a.jpg" },
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
    expect(items[0]!.kind).toBe("image");
    expect((items[0] as { imageFormat: string }).imageFormat).toBe("JPEG");
  });

  it("uses pdf_note for pdf blobs", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://cdn.example.com/a.pdf", filename: "a.pdf" },
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
    expect(items[0]!.kind).toBe("pdf_note");
  });

  it("adds pdf_note when signedUrl is missing", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { filename: "orphan.bin" },
      error: null,
    });
    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0]!.kind).toBe("pdf_note");
    expect(
      (items[0] as { noteLines: string[] }).noteLines.some((l) =>
        l.includes("View original"),
      ),
    ).toBe(true);
  });

  it("adds pdf_note when fetch throws", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://cdn.example.com/x.png", filename: "x.png" },
      error: null,
    });
    vi.mocked(global.fetch).mockRejectedValue(new Error("network"));

    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0]!.kind).toBe("pdf_note");
  });

  it("adds pdf_note when response is not ok", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://cdn.example.com/x.png", filename: "x.png" },
      error: null,
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      blob: async () => new Blob(),
    } as Response);

    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0]!.kind).toBe("pdf_note");
  });

  it("rejects oversized blobs with a friendly note", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: {
        signedUrl: "https://cdn.example.com/big.png",
        filename: "big.png",
      },
      error: null,
    });
    const huge = new Uint8Array(3_000_000);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => new Blob([huge], { type: "image/png" }),
    } as Response);

    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0]!.kind).toBe("pdf_note");
    expect((items[0] as { noteLines: string[] }).noteLines[0]).toMatch(
      /too large/i,
    );
  });

  it("embeds png and webp images", async () => {
    for (const [mime, fmt] of [
      ["image/png", "PNG"],
      ["image/webp", "WEBP"],
    ] as const) {
      vi.mocked(invokeFunction).mockResolvedValue({
        data: {
          signedUrl: `https://cdn.example.com/a.${fmt.toLowerCase()}`,
          filename: `a.${fmt.toLowerCase()}`,
        },
        error: null,
      });
      const blob = new Blob([new Uint8Array(50)], { type: mime });
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        blob: async () => blob,
      } as Response);

      const items = await buildSellerPacketAppendixItems([
        inv({ id: "1", document_id: "doc-1" }),
      ]);
      expect(items[0]!.kind).toBe("image");
      expect((items[0] as { imageFormat: string }).imageFormat).toBe(fmt);
    }
  });

  it("uses pdf_note for unsupported image types", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://cdn.example.com/a.gif", filename: "a.gif" },
      error: null,
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => new Blob([new Uint8Array(20)], { type: "image/gif" }),
    } as Response);

    const items = await buildSellerPacketAppendixItems([
      inv({ id: "1", document_id: "doc-1" }),
    ]);
    expect(items[0]!.kind).toBe("pdf_note");
  });

  it("uses neutral title when vendor name is blank", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("x"),
    });
    const items = await buildSellerPacketAppendixItems([
      inv({
        id: "1",
        document_id: "doc-1",
        vendor_name: "   ",
      }),
    ]);
    expect((items[0] as { title: string }).title).toContain("Document");
  });
});
