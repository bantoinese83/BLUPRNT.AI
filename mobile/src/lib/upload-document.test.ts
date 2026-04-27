import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadDocumentWithType,
  normalizeDocumentUploadMime,
} from "@/lib/upload-document";
import { invokeFunction } from "@/lib/supabase";
import { showAppToast } from "@/lib/app-toast";

vi.mock("@/lib/supabase", () => ({
  invokeFunction: vi.fn(),
}));

vi.mock("@/lib/app-toast", () => ({
  showAppToast: vi.fn(),
}));

describe("normalizeDocumentUploadMime", () => {
  it("defaults to image/jpeg for unknown hints/exts", () => {
    expect(
      normalizeDocumentUploadMime("file:///var/IMG.CR2.heic", undefined),
    ).toBe("image/heic");
  });

  it("handles known extensions", () => {
    expect(normalizeDocumentUploadMime("a.png")).toBe("image/png");
    expect(normalizeDocumentUploadMime("a.webp")).toBe("image/webp");
    expect(normalizeDocumentUploadMime("a.pdf")).toBe("application/pdf");
    expect(normalizeDocumentUploadMime("a.unknown")).toBe("image/jpeg");
  });

  it("keeps declared JPEG", () => {
    expect(normalizeDocumentUploadMime("file:///a", "image/jpeg")).toBe(
      "image/jpeg",
    );
  });
});

describe("uploadDocumentWithType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { ledger_entry_id: "inv-1", document_type: "quote" },
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
    expect(result.ledger_entry_id).toBe("inv-1");
    expect(result.documentType).toBe("quote");
    expect(invokeFunction).toHaveBeenCalled();
    const call = vi.mocked(invokeFunction).mock.calls[0]!;
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

  it("shows budget alert toast when budget_health is present", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: {
        ledger_entry_id: "inv-1",
        document_type: "quote",
        budget_health: {
          isOverBudget: true,
          isNearingBudget: false,
          percentOfMax: 110,
        },
      },
      error: null,
    });

    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );

    expect(result.success).toBe(true);
    expect(showAppToast).toHaveBeenCalledWith(
      expect.stringContaining("Budget Alert: Project at 110%"),
    );
  });

  it("shows budget nearing warning when budget_health is nearing", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: {
        ledger_entry_id: "inv-1",
        document_type: "invoice",
        budget_health: {
          isOverBudget: false,
          isNearingBudget: true,
          percentOfMax: 85,
        },
      },
      error: null,
    });

    await uploadDocumentWithType("file:///a.jpg", "image/jpeg", "p1");

    expect(showAppToast).toHaveBeenCalledWith(
      expect.stringContaining("Budget Note: 85% of budget used"),
    );
  });

  it("shows AI processing toast for non-manual documents", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { ledger_entry_id: "inv-1", document_type: "invoice" },
      error: null,
    });

    await uploadDocumentWithType("file:///a.jpg", "image/jpeg", "p1");

    expect(showAppToast).toHaveBeenCalledWith(
      expect.stringContaining("AI is processing the details"),
      { type: "success" },
    );
  });

  it("does not show AI processing toast for manual documents", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { ledger_entry_id: "inv-1", document_type: "manual" },
      error: null,
    });

    await uploadDocumentWithType("file:///a.jpg", "image/jpeg", "p1");

    // It might still show budget toast, but not the OCR toast
    const calls = vi.mocked(showAppToast).mock.calls;
    const hasOcrToast = calls.some((c) =>
      String(c[0]).includes("AI is processing"),
    );
    expect(hasOcrToast).toBe(false);
  });
});
