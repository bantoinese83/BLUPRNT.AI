import { describe, it, expect, vi, beforeEach } from "vitest";
import { alertMock } from "@/test/react-native-mock";
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
      data: { invoice_id: "inv-1" },
      error: null,
    });
    alertMock.mockImplementation(
      (
        _title: string,
        _msg: string,
        buttons: { text: string; onPress?: () => void }[],
      ) => {
        const invoice = buttons.find((b) => b.text === "Invoice");
        invoice?.onPress?.();
      },
    );
  });

  it("uploads after user picks Invoice", async () => {
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(true);
    expect(result.invoice_id).toBe("inv-1");
    expect(invokeFunction).toHaveBeenCalled();
  });

  it("uploads after user picks Quote", async () => {
    alertMock.mockImplementationOnce((_title, _msg, buttons) => {
      const btn = buttons.find((b: any) => b.text === "Quote");
      btn?.onPress?.();
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(true);
  });

  it("uploads after user picks Warranty", async () => {
    alertMock.mockImplementationOnce((_title, _msg, buttons) => {
      const btn = buttons.find((b: any) => b.text === "Warranty");
      btn?.onPress?.();
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(true);
  });

  it("uploads after user picks Permit", async () => {
    alertMock.mockImplementationOnce((_title, _msg, buttons) => {
      const btn = buttons.find((b: any) => b.text === "Permit");
      btn?.onPress?.();
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(true);
  });

  it("handles Cancel", async () => {
    alertMock.mockImplementationOnce((_title, _msg, buttons) => {
      const btn = buttons.find((b: any) => b.text === "Cancel");
      btn?.onPress?.();
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(false);
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
    expect(result.error).toContain("Check your connection");
    vi.useRealTimers();
  });
});
