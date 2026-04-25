import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeFunction } from "./supabase";
import {
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
  saveOnboardingProject,
  DEFAULT_ESTIMATE_MIN,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_CONFIDENCE,
} from "./onboarding-helpers";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn().mockResolvedValue({ data: {}, error: null }),
}));

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

  describe("saveOnboardingProject", () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      functions: {
        invoke: vi.fn(),
      },
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("creates a new property and project when no existing property found", async () => {
      // Mock existing properties check (empty)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Mock property insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "prop-1" }, error: null }),
      });

      // Mock project insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "proj-1" }, error: null }),
      });

      const result = await saveOnboardingProject({
        supabase: mockSupabase,
        userId: "user-1",
        projectType: "Kitchen",
        stage: "Just planning",
        locationInput: "123 Main St",
        zipCode: "12345",
        estimate: null,
        photos: [],
      });

      expect(result).toBe("proj-1");
      expect(mockSupabase.from).toHaveBeenCalledWith("properties");
      expect(mockSupabase.from).toHaveBeenCalledWith("projects");
    });

    it("uses existing property if found", async () => {
      // Mock existing properties check (found)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "existing-prop" }], error: null }),
      });

      // Mock project insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "proj-1" }, error: null }),
      });

      const result = await saveOnboardingProject({
        supabase: mockSupabase,
        userId: "user-1",
        projectType: "Bathroom",
        stage: "Collecting quotes",
        locationInput: "",
        zipCode: "54321",
        estimate: null,
        photos: [],
      });

      expect(result).toBe("proj-1");
      // Should NOT call insert for properties
      const propertyCalls = mockSupabase.from.mock.calls.filter(
        (c: any[]) => c[0] === "properties",
      );
      expect(propertyCalls.length).toBe(1); // Only the select call
    });

    it("inserts scope items if estimate is provided", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "prop-1" }], error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "proj-1" }, error: null }),
      });

      // Mock scope items insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const estimate = {
        summary: {
          estimated_min_total: 1000,
          estimated_max_total: 2000,
          confidence_score: 4,
        },
        scope_items: [
          {
            category: "General",
            description: "Demo",
            finish_tier: "mid",
            quantity: 1,
            unit: "ea",
            unit_cost_min: 100,
            unit_cost_max: 200,
            total_cost_min: 100,
            total_cost_max: 200,
            confidence_score: 5,
            source: "text",
          },
        ],
      } as any;

      await saveOnboardingProject({
        supabase: mockSupabase,
        userId: "user-1",
        projectType: "Painting",
        stage: "Just planning",
        locationInput: "",
        zipCode: "11111",
        estimate,
        photos: [],
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("scope_items");
    });

    it("inserts scope items with grounding_sources and regional data in summary", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "prop-1" }], error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "proj-grounded" }, error: null }),
      });

      // Mock scope items insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      // Estimate with grounding data from Google Search
      const groundedEstimate = {
        summary: {
          estimated_min_total: 12000,
          estimated_max_total: 18000,
          confidence_score: 5,
          grounding_sources: [
            {
              title: "Home Depot Tile Pricing 2026",
              url: "https://homedepot.com/tile",
            },
            {
              title: "Lowe's Flooring",
              url: "https://lowes.com/flooring",
            },
          ],
          regional_context:
            "Austin TX market experiencing material cost increases",
          regional_signal: "Matched $85/hr labor from BLS Austin 2026",
          value_engineering_tips: [
            "Use stock tile to reduce material cost by 20%",
          ],
        },
        scope_items: [
          {
            category: "Flooring",
            description: "Hardwood installation",
            finish_tier: "premium",
            quantity: 200,
            unit: "sqft",
            unit_cost_min: 8,
            unit_cost_max: 12,
            total_cost_min: 1600,
            total_cost_max: 2400,
            confidence_score: 5,
            source: "text",
            metadata: {
              materials: [
                {
                  name: "Bruce Hardwood Plank",
                  brand: "Bruce",
                  quantity: 200,
                  unit: "sqft",
                  estimated_cost: 4.5,
                },
              ],
            },
          },
        ],
        explanations: ["Market-verified using Google Search for ZIP 78701"],
      } as any;

      const result = await saveOnboardingProject({
        supabase: mockSupabase,
        userId: "user-grounded",
        projectType: "Flooring",
        stage: "Collecting quotes",
        locationInput: "78701",
        zipCode: "78701",
        estimate: groundedEstimate,
        photos: [],
      });

      expect(result).toBe("proj-grounded");
      expect(mockSupabase.from).toHaveBeenCalledWith("scope_items");
    });

    it("triggers photo-to-scope function if photos provided", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "prop-1" }], error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "proj-1" }, error: null }),
      });

      const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

      await saveOnboardingProject({
        supabase: mockSupabase,
        userId: "user-1",
        projectType: "Kitchen",
        stage: "Just planning",
        locationInput: "",
        zipCode: "12345",
        estimate: null,
        photos: [mockFile],
      });

      expect(invokeFunction).toHaveBeenCalledWith(
        "photo-to-scope",
        expect.any(Object),
      );
    });

    it("throws error if property creation fails", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Property fail" },
        }),
      });

      await expect(
        saveOnboardingProject({
          supabase: mockSupabase,
          userId: "user-1",
          projectType: "Kitchen",
          stage: "Just planning",
          locationInput: "",
          zipCode: "12345",
          estimate: null,
          photos: [],
        }),
      ).rejects.toThrow("Property fail");
    });
  });

  describe("constants", () => {
    it("has expected default estimate values", () => {
      expect(DEFAULT_ESTIMATE_MIN).toBeGreaterThan(0);
      expect(DEFAULT_ESTIMATE_MAX).toBeGreaterThan(DEFAULT_ESTIMATE_MIN);
      expect(DEFAULT_ESTIMATE_CONFIDENCE).toBeGreaterThanOrEqual(1);
      expect(DEFAULT_ESTIMATE_CONFIDENCE).toBeLessThanOrEqual(5);
    });
  });
});
