import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  alertMock,
  canOpenURLMock,
  openURLMock,
} from "@/test/react-native-mock";
import { openOriginalDocumentForInvoice } from "@/lib/open-original-document";
import { invokeFunction } from "@/lib/supabase";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

describe("openOriginalDocumentForInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when invoke fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("x"),
    });
    const ok = await openOriginalDocumentForInvoice("i1");
    expect(ok).toBe(false);
    expect(alertMock).toHaveBeenCalled();
  });

  it("opens url when allowed", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://x.com/a.pdf" },
      error: null,
    });
    canOpenURLMock.mockResolvedValue(true);
    openURLMock.mockResolvedValue(undefined);

    const ok = await openOriginalDocumentForInvoice("i1");
    expect(ok).toBe(true);
    expect(openURLMock).toHaveBeenCalledWith("https://x.com/a.pdf");
  });

  it("returns false when API returns error string", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "No original" },
      error: null,
    });
    const ok = await openOriginalDocumentForInvoice("i1");
    expect(ok).toBe(false);
    expect(alertMock).toHaveBeenCalled();
  });

  it("returns false when signed_url missing", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: undefined },
      error: null,
    });
    const ok = await openOriginalDocumentForInvoice("i1");
    expect(ok).toBe(false);
  });

  it("returns false when link cannot be opened", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://x.com/a.pdf" },
      error: null,
    });
    canOpenURLMock.mockResolvedValue(false);
    const ok = await openOriginalDocumentForInvoice("i1");
    expect(ok).toBe(false);
  });

  it("returns false when openURL throws", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signed_url: "https://x.com/a.pdf" },
      error: null,
    });
    canOpenURLMock.mockResolvedValue(true);
    openURLMock.mockRejectedValue(new Error("cannot open"));
    const ok = await openOriginalDocumentForInvoice("i1");
    expect(ok).toBe(false);
    expect(alertMock).toHaveBeenCalled();
  });
});
