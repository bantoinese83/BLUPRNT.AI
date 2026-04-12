import { describe, it, expect, vi, beforeEach } from "vitest";
import { openOriginalDocumentForInvoice } from "./open-original-document";
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

describe("openOriginalDocumentForInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("returns false and toasts on invoke error", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("network"),
    });
    const ok = await openOriginalDocumentForInvoice("inv-1");
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("returns false when body contains error string", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "No original file" },
      error: null,
    });
    const ok = await openOriginalDocumentForInvoice("inv-2");
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("opens window when signed_url present", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://example.com/doc.pdf" },
      error: null,
    });
    const ok = await openOriginalDocumentForInvoice("inv-3");
    expect(ok).toBe(true);
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/doc.pdf",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("returns false when no signed_url", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: {},
      error: null,
    });
    const ok = await openOriginalDocumentForInvoice("inv-4");
    expect(ok).toBe(false);
  });
});
