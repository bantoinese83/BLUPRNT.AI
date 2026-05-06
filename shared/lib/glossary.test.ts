import { describe, expect, it } from "vitest";
import { getGlossaryEntry, listGlossaryEntries } from "./glossary.ts";

describe("glossary", () => {
  it("returns null for blank/missing keys", () => {
    expect(getGlossaryEntry(null)).toBeNull();
    expect(getGlossaryEntry("")).toBeNull();
    expect(getGlossaryEntry("   ")).toBeNull();
    expect(getGlossaryEntry("nonsense-term")).toBeNull();
  });

  it("looks up by id", () => {
    expect(getGlossaryEntry("coi")?.term).toBe("COI");
    expect(getGlossaryEntry("draw-schedule")?.term).toBe("Draw schedule");
  });

  it("matches by term and alias case-insensitively", () => {
    expect(getGlossaryEntry("Certificate of Insurance")?.id).toBe("coi");
    expect(getGlossaryEntry("RELEASE OF LIEN")?.id).toBe("lien-waiver");
    expect(getGlossaryEntry("snag list")?.id).toBe("punch-list");
  });

  it("entries have non-empty term + short copy", () => {
    for (const e of listGlossaryEntries()) {
      expect(e.term.length).toBeGreaterThan(0);
      expect(e.short.length).toBeGreaterThan(10);
    }
  });
});
