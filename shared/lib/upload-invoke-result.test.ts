import { describe, it, expect } from "vitest";
import { extractUploadFailureFromInvokeResult } from "./upload-invoke-result";

describe("extractUploadFailureFromInvokeResult", () => {
  it("reads error and error_code from data body", () => {
    const r = extractUploadFailureFromInvokeResult(
      {
        error: "Upload limit reached. Upgrade for more.",
        error_code: "INVOICE_LIMIT_FREE_PROJECT",
      },
      null,
    );
    expect(r?.errorCode).toBe("INVOICE_LIMIT_FREE_PROJECT");
    expect(r?.message).toContain("limit");
  });

  it("returns null when data is success shape without error", () => {
    const r = extractUploadFailureFromInvokeResult(
      { invoice_id: "inv-1" },
      null,
    );
    expect(r).toBeNull();
  });
});
