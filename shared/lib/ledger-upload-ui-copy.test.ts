import { describe, expect, it } from "vitest";
import { ledgerUploadLimitUiCopy } from "./ledger-upload-ui-copy";

describe("ledgerUploadLimitUiCopy", () => {
  it("returns null when not blocked", () => {
    expect(ledgerUploadLimitUiCopy(null)).toBeNull();
  });

  it("returns free tier copy", () => {
    const copy = ledgerUploadLimitUiCopy("free_project");
    expect(copy?.title).toMatch(/Free upload limit/i);
    expect(copy?.cta).toMatch(/upgrade/i);
  });

  it("returns architect monthly copy", () => {
    const copy = ledgerUploadLimitUiCopy("architect_month");
    expect(copy?.title).toMatch(/Monthly upload limit/i);
    expect(copy?.body).toMatch(/10/);
  });
});
