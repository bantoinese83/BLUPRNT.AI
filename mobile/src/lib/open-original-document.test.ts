import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  alertMock,
  canOpenURLMock,
  openURLMock,
} from "@/test/react-native-mock";
import {
  fetchLedgerEntryOriginalSignedUrl,
  openOriginalDocumentForLedgerEntry,
} from "@/lib/open-original-document";
import { invokeFunction } from "@/lib/supabase";
import { ledgerOriginalMessages } from "@shared/lib/ledger-original-messages";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

describe("fetchLedgerEntryOriginalSignedUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when signed_url present", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://x.com/a.pdf", filename: "a.pdf" },
      error: null,
    });
    const r = await fetchLedgerEntryOriginalSignedUrl("i1");
    expect(r).toEqual({
      ok: true,
      signedUrl: "https://x.com/a.pdf",
      filename: "a.pdf",
    });
  });

  it("returns error when invoke fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("x"),
    });
    const r = await fetchLedgerEntryOriginalSignedUrl("i1");
    expect(r).toEqual({
      ok: false,
      message: ledgerOriginalMessages.network,
    });
  });
});

describe("openOriginalDocumentForLedgerEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when invoke fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("x"),
    });
    const ok = await openOriginalDocumentForLedgerEntry("i1");
    expect(ok).toBe(false);
    expect(alertMock).toHaveBeenCalled();
  });

  it("opens url when allowed", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://x.com/a.pdf" },
      error: null,
    });
    canOpenURLMock.mockResolvedValue(true);
    openURLMock.mockResolvedValue(undefined);

    const ok = await openOriginalDocumentForLedgerEntry("i1");
    expect(ok).toBe(true);
    expect(openURLMock).toHaveBeenCalledWith("https://x.com/a.pdf");
  });

  it("returns false when API returns error string", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "No original" },
      error: null,
    });
    const ok = await openOriginalDocumentForLedgerEntry("i1");
    expect(ok).toBe(false);
    expect(alertMock).toHaveBeenCalled();
  });

  it("returns false when signed_url missing", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: undefined },
      error: null,
    });
    const ok = await openOriginalDocumentForLedgerEntry("i1");
    expect(ok).toBe(false);
  });

  it("returns false when link cannot be opened", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://x.com/a.pdf" },
      error: null,
    });
    canOpenURLMock.mockResolvedValue(false);
    const ok = await openOriginalDocumentForLedgerEntry("i1");
    expect(ok).toBe(false);
  });

  it("returns false when openURL throws", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { signedUrl: "https://x.com/a.pdf" },
      error: null,
    });
    canOpenURLMock.mockResolvedValue(true);
    openURLMock.mockRejectedValue(new Error("cannot open"));
    const ok = await openOriginalDocumentForLedgerEntry("i1");
    expect(ok).toBe(false);
    expect(alertMock).toHaveBeenCalled();
  });
});
