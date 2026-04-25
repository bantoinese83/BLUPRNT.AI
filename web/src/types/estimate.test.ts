import { describe, it, expect } from "vitest";
import type {
  EstimateSummary,
  PhotoToScopeResult,
  ScopeItemPreview,
} from "@/types/estimate";

/**
 * Type-guard and schema shape tests for the estimate types.
 * These tests validate that the runtime shape of objects conforms to the
 * TypeScript types, especially after the grounding_sources enhancement.
 */
describe("estimate types - schema validation", () => {
  describe("EstimateSummary", () => {
    it("accepts a minimal summary without optional fields", () => {
      const summary: EstimateSummary = {
        estimated_min_total: 5000,
        estimated_max_total: 10000,
        confidence_score: 3,
      };

      expect(summary.estimated_min_total).toBe(5000);
      expect(summary.estimated_max_total).toBe(10000);
      expect(summary.confidence_score).toBe(3);
      expect(summary.grounding_sources).toBeUndefined();
      expect(summary.regional_context).toBeUndefined();
      expect(summary.regional_signal).toBeUndefined();
      expect(summary.value_engineering_tips).toBeUndefined();
    });

    it("accepts a fully-grounded summary with all fields", () => {
      const summary: EstimateSummary = {
        estimated_min_total: 15000,
        estimated_max_total: 25000,
        confidence_score: 5,
        grounding_sources: [
          { title: "Home Depot Tile", url: "https://homedepot.com/tile" },
          { title: "BLS Labor Report" }, // url is optional
        ],
        regional_context: "Austin TX market is hot in Q2 2026",
        regional_signal: "Matched $85/hr labor from BLS Austin 2026",
        value_engineering_tips: [
          "Use stock cabinets to save 20%",
          "Defer backsplash to phase 2",
        ],
      };

      expect(summary.grounding_sources).toHaveLength(2);
      expect(summary.grounding_sources![0]!.url).toBe(
        "https://homedepot.com/tile",
      );
      expect(summary.grounding_sources![1]!.url).toBeUndefined();
      expect(summary.regional_context).toContain("Austin");
      expect(summary.value_engineering_tips).toHaveLength(2);
    });

    it("accepts grounding_sources with an empty array", () => {
      const summary: EstimateSummary = {
        estimated_min_total: 5000,
        estimated_max_total: 8000,
        confidence_score: 4,
        grounding_sources: [],
      };

      expect(summary.grounding_sources).toHaveLength(0);
    });
  });

  describe("ScopeItemPreview", () => {
    it("accepts a scope item with materials including estimated_cost", () => {
      const item: ScopeItemPreview = {
        id: "item-1",
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
              name: "Bruce Hardwood",
              brand: "Bruce",
              quantity: 200,
              unit: "sqft",
              estimated_cost: 4.5,
            },
          ],
        },
      };

      expect(item.metadata!.materials![0]!.estimated_cost).toBe(4.5);
      expect(item.metadata!.materials![0]!.brand).toBe("Bruce");
    });

    it("accepts a scope item without optional metadata fields", () => {
      const item: ScopeItemPreview = {
        id: "item-2",
        category: "Demo",
        description: "Demolition work",
        finish_tier: null,
        quantity: null,
        unit: null,
        unit_cost_min: null,
        unit_cost_max: null,
        total_cost_min: null,
        total_cost_max: null,
        confidence_score: null,
        source: "photo",
      };

      expect(item.metadata).toBeUndefined();
      expect(item.finish_tier).toBeNull();
    });
  });

  describe("PhotoToScopeResult", () => {
    it("accepts a full market-grounded result", () => {
      const result: PhotoToScopeResult = {
        project_id: "proj-123",
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
            "Austin TX market experiencing material cost increases in Q2 2026",
          regional_signal:
            "Matched $85/hr plumber rate from BLS Austin area data",
          value_engineering_tips: [
            "Choose stock tile for 20% material savings",
            "Bundle flooring and demo to reduce mobilization cost",
          ],
        },
        scope_items: [],
        explanations: ["Market-verified via Google Search for ZIP 78701"],
        area_label: "Austin, TX",
        used_fallback: false,
        fallback_reason: null,
      };

      expect(result.summary.grounding_sources).toHaveLength(2);
      expect(result.summary.grounding_sources![0]!.title).toContain(
        "Home Depot",
      );
      expect(result.summary.value_engineering_tips).toHaveLength(2);
      expect(result.area_label).toBe("Austin, TX");
      expect(result.used_fallback).toBe(false);
    });

    it("accepts a fallback result without grounding data", () => {
      const result: PhotoToScopeResult = {
        project_id: null,
        summary: {
          estimated_min_total: 8000,
          estimated_max_total: 15000,
          confidence_score: 2,
        },
        scope_items: [],
        explanations: [],
        used_fallback: true,
        fallback_reason: "ai_unavailable",
      };

      expect(result.used_fallback).toBe(true);
      expect(result.summary.grounding_sources).toBeUndefined();
      expect(result.project_id).toBeNull();
    });
  });
});
