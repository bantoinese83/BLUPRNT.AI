import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadDocumentWithType,
  normalizeInvoiceUploadMime,
} from "@/lib/upload-document";
import { invokeFunction } from "@/lib/supabase";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

describe("normalizeInvoiceUploadMime", () => {
  it("maps iOS .heic paths when MIME is missing", () => {
    expect(
      normalizeInvoiceUploadMime("file:///var/IMG.CR2.heic", undefined),
    ).toBe("image/heic");
  });

  it("maps .png paths when MIME is missing", () => {
    expect(normalizeInvoiceUploadMime("a.png")).toBe("image/png");
  });

  it("maps .webp paths when MIME is missing", () => {
    expect(normalizeInvoiceUploadMime("a.webp")).toBe("image/webp");
  });

  it("maps .pdf paths when MIME is missing", () => {
    expect(normalizeInvoiceUploadMime("a.pdf")).toBe("application/pdf");
  });

  it("defaults to image/jpeg for unknown", () => {
    expect(normalizeInvoiceUploadMime("a.unknown")).toBe("image/jpeg");
  });

  it("keeps declared JPEG", () => {
    expect(normalizeInvoiceUploadMime("file:///a", "image/jpeg")).toBe(
      "image/jpeg",
    );
  });
});

describe("uploadDocumentWithType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { invoice_id: "inv-1", document_type: "quote" },
      error: null,
    });
  });

  it("uploads with document_type auto (no picker)", async () => {
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(true);
    expect(result.invoice_id).toBe("inv-1");
    expect(result.documentType).toBe("quote");
    expect(invokeFunction).toHaveBeenCalled();
    const call = vi.mocked(invokeFunction).mock.calls[0];
    const body = call[1]?.body as FormData;
    expect(body.get("document_type")).toBe("auto");
  });

  it("returns friendly error when invoke fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("network"),
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns error when server returns error field", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "bad" },
      error: null,
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles timeout error", async () => {
    vi.useFakeTimers();
    vi.mocked(invokeFunction).mockImplementation(() => new Promise(() => {}));

    const promise = uploadDocumentWithType("file:///a.jpg", "image/jpeg", "p1");
    vi.advanceTimersByTime(61000);

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    vi.useRealTimers();
  });
});
