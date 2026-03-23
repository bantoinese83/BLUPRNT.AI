import { describe, it, expect } from "vitest";
import {
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
} from "./onboarding-helpers";

describe("onboarding-helpers", () => {
  describe("projectTypeToRoomType", () => {
    it("returns kitchen for Kitchen", () => {
      expect(projectTypeToRoomType("Kitchen")).toBe("kitchen");
    });
    it("returns bathroom for Bathroom", () => {
      expect(projectTypeToRoomType("Bathroom")).toBe("bathroom");
    });
    it("returns other for other types", () => {
      expect(projectTypeToRoomType("Painting")).toBe("other");
      expect(projectTypeToRoomType("Something else")).toBe("other");
    });
    it("returns other for null", () => {
      expect(projectTypeToRoomType(null)).toBe("other");
    });
  });

  describe("projectTypeToDb", () => {
    it("maps correctly for all known types", () => {
      expect(projectTypeToDb("Kitchen")).toBe("kitchen");
      expect(projectTypeToDb("Bathroom")).toBe("bath");
      expect(projectTypeToDb("Painting")).toBe("paint");
      expect(projectTypeToDb("Roof")).toBe("roof");
      expect(projectTypeToDb("Flooring")).toBe("flooring");
      expect(projectTypeToDb("Something else")).toBe("other");
    });
    it("returns other for null", () => {
      expect(projectTypeToDb(null)).toBe("other");
    });
  });

  describe("stageToDb", () => {
    it("maps Collecting quotes to collecting_quotes", () => {
      expect(stageToDb("Collecting quotes")).toBe("collecting_quotes");
    });
    it("maps Already started work to in_progress", () => {
      expect(stageToDb("Already started work")).toBe("in_progress");
    });
    it("returns planning for Just planning and null", () => {
      expect(stageToDb("Just planning")).toBe("planning");
      expect(stageToDb(null)).toBe("planning");
    });
  });

  describe("projectDisplayName", () => {
    it("returns project display names", () => {
      expect(projectDisplayName("Kitchen")).toBe("Kitchen project");
      expect(projectDisplayName("Bathroom")).toBe("Bathroom project");
    });
    it("returns My project for Something else and null", () => {
      expect(projectDisplayName("Something else")).toBe("My project");
      expect(projectDisplayName(null)).toBe("My project");
    });
  });
});
