import { describe, it, expect, vi } from "vitest";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
  isSupabaseConfigured: () => true,
  supabase: {},
}));

import {
  normalizeStageFromDraft,
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
} from "./onboarding-helpers";

describe("onboarding-helpers (pure)", () => {
  it("normalizes legacy stage labels", () => {
    expect(normalizeStageFromDraft("Planning & budgeting")).toBe(
      "Just planning",
    );
    expect(normalizeStageFromDraft("Collecting quotes")).toBe(
      "Collecting quotes",
    );
    expect(normalizeStageFromDraft("nope")).toBeNull();
  });

  it("maps project type to room type and db", () => {
    expect(projectTypeToRoomType("Kitchen")).toBe("kitchen");
    expect(projectTypeToRoomType("Bathroom")).toBe("bathroom");
    expect(projectTypeToRoomType("Painting")).toBe("other");
    expect(projectTypeToDb("Bathroom")).toBe("bath");
    expect(projectTypeToDb(null)).toBe("other");
  });

  it("maps stage to db and display name", () => {
    expect(stageToDb("Already started work")).toBe("in_progress");
    expect(stageToDb("Collecting quotes")).toBe("collecting_quotes");
    expect(stageToDb(null)).toBe("planning");
    expect(projectDisplayName("Kitchen")).toBe("Kitchen project");
    expect(projectDisplayName("Something else")).toBe("My project");
    expect(projectDisplayName(null)).toBe("My project");
  });
});
