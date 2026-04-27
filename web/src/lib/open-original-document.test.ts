import { describe, it, expect, vi, beforeEach } from "vitest";
import { openOriginalDocumentForLedgerEntry } from "./open-original-document";
import { invokeFunction } from "./supabase";
import { toast } from "sonner";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("openOriginalDocumentForLedgerEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false and toasts on invoke error", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("network"),
    });
    const ok = await openOriginalDocumentForLedgerEntry("inv-1");
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("returns false when body contains error string", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "No original file" },
      error: null,
    });
    const ok = await openOriginalDocumentForLedgerEntry("inv-2");
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("opens window when signed_url present", async () => {
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => ({}) as Window);
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://example.com/doc.pdf" },
      error: null,
    });
    const ok = await openOriginalDocumentForLedgerEntry("inv-3");
    expect(ok).toBe(true);
    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/doc.pdf",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("returns false when popup is blocked", async () => {
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://example.com/doc.pdf" },
      error: null,
    });
    const ok = await openOriginalDocumentForLedgerEntry("inv-popup");
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("returns false when no signed_url", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: {},
      error: null,
    });
    const ok = await openOriginalDocumentForLedgerEntry("inv-4");
    expect(ok).toBe(false);
  });
});
