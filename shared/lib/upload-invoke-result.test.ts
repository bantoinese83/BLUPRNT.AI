import { describe, it, expect } from "vitest";
import { extractUploadFailureFromInvokeResult } from "./upload-invoke-result.ts";

describe("extractUploadFailureFromInvokeResult", () => {
  it("reads error and error_code from data body", () => {
    const r = extractUploadFailureFromInvokeResult(
      {
        error: "Upload limit reached. Upgrade for more.",
        error_code: "LEDGER_LIMIT_FREE_PROJECT",
      },
      null,
    );
    expect(r?.errorCode).toBe("LEDGER_LIMIT_FREE_PROJECT");
    expect(r?.message).toContain("limit");
  });

  it("returns null when data is success shape without error", () => {
    const r = extractUploadFailureFromInvokeResult(
      { ledger_entry_id: "inv-1" },
      null,
    );
    expect(r).toBeNull();
  });

  it("extracts error from error object context body", () => {
    const err = {
      message: "Functions error",
      context: {
        body: JSON.stringify({
          error: "Upload limit reached",
          error_code: "LIMIT_REACHED",
        }),
      },
    };
    const r = extractUploadFailureFromInvokeResult(null, err);
    expect(r?.errorCode).toBe("LIMIT_REACHED");
    expect(r?.message).toBe("Upload limit reached");
  });

  it("handles non-string context body", () => {
    const err = {
      context: {
        body: { error: "Free plan limit", error_code: "DIRECT" },
      },
    };
    const r = extractUploadFailureFromInvokeResult(null, err);
    expect(r?.errorCode).toBe("DIRECT");
    expect(r?.message).toBe("Free plan limit");
  });

  it("falls back to generic message when no body matches", () => {
    const r = extractUploadFailureFromInvokeResult(null, new Error("network"));
    expect(r?.message).toBe("Check your internet connection and try again.");
  });
});
