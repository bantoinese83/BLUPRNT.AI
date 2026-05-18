import { describe, it, expect } from "vitest";
import {
  ARCHITECT_MONTHLY_UPLOAD_CAP,
  getLedgerUploadBlockReason,
} from "./ledger-upload-client-gate";

describe("getLedgerUploadBlockReason", () => {
  it("returns null for project pass", () => {
    expect(
      getLedgerUploadBlockReason(
        [{ document_type: "invoice" }, { document_type: "invoice" }],
        {
          isArchitect: false,
          hasProjectPass: true,
        },
      ),
    ).toBeNull();
  });

  it("returns architect_month at global cap", () => {
    expect(
      getLedgerUploadBlockReason([], {
        isArchitect: true,
        hasProjectPass: false,
        subscription: {
          status: "active",
          current_period_end: null,
          revenuecat_entitlement_active: true,
          ledger_uploads_count: ARCHITECT_MONTHLY_UPLOAD_CAP,
        },
      }),
    ).toBe("architect_month");
  });

  it("returns free_project at third bill/receipt", () => {
    const entries = [
      { document_type: "invoice" },
      { document_type: "receipt" },
      { document_type: "invoice" },
    ];
    expect(
      getLedgerUploadBlockReason(entries, {
        isArchitect: false,
        hasProjectPass: false,
      }),
    ).toBe("free_project");
  });

  it("unblocks immediately when revenueCatPro is true", () => {
    expect(
      getLedgerUploadBlockReason(
        [
          { document_type: "invoice" },
          { document_type: "invoice" },
          { document_type: "invoice" },
        ],
        {
          isArchitect: false,
          hasProjectPass: false,
          revenueCatPro: true,
        },
      ),
    ).toBeNull();
  });
});
