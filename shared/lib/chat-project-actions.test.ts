import { describe, expect, it } from "vitest";
import {
  chatActionButtonLabel,
  normalizeChatProjectActions,
} from "./chat-project-actions";

describe("normalizeChatProjectActions", () => {
  it("returns empty for non-arrays", () => {
    expect(normalizeChatProjectActions(null)).toEqual([]);
    expect(normalizeChatProjectActions({})).toEqual([]);
  });

  it("keeps valid actions and drops invalid types", () => {
    expect(
      normalizeChatProjectActions([
        {
          type: "add_scope",
          data: { category: "Electrical" },
          reason: "Add outlets",
        },
        { type: "bogus", data: {}, reason: "x" },
        { type: "suggest_photo", reason: "After drywall" },
      ]),
    ).toEqual([
      {
        type: "add_scope",
        data: { category: "Electrical" },
        reason: "Add outlets",
      },
      {
        type: "suggest_photo",
        data: {},
        reason: "After drywall",
      },
    ]);
  });

  it("fills default reason and data object", () => {
    expect(
      normalizeChatProjectActions([
        { type: "update_scope", data: null, reason: "" },
      ]),
    ).toEqual([
      {
        type: "update_scope",
        data: {},
        reason: "Suggested next step",
      },
    ]);
  });
});

describe("chatActionButtonLabel", () => {
  it("returns labels for each type", () => {
    expect(chatActionButtonLabel("add_scope")).toBe("Open scope");
    expect(chatActionButtonLabel("update_scope")).toBe("Review scope");
    expect(chatActionButtonLabel("suggest_photo")).toBe("Add photos");
  });
});
