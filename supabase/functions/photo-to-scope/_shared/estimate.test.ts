import { assertEquals } from "std/assert";
import {
  cityFromZip,
  normalizeScopeSourceForDb,
  sanitizeEstimate,
} from "./estimate.ts";

Deno.test("normalizeScopeSourceForDb - DB only allows text | photo", () => {
  assertEquals(normalizeScopeSourceForDb("photo"), "photo");
  assertEquals(normalizeScopeSourceForDb("fallback"), "text");
  assertEquals(normalizeScopeSourceForDb("text"), "text");
  assertEquals(normalizeScopeSourceForDb(undefined), "text");
  assertEquals(normalizeScopeSourceForDb("vision"), "text");
});

Deno.test("cityFromZip - handles edge cases", () => {
  assertEquals(cityFromZip("90210"), "Los Angeles area");
  assertEquals(cityFromZip("10001"), "NYC Metro area");
  assertEquals(cityFromZip("abc"), "your area");
  assertEquals(cityFromZip(""), "your area");
  assertEquals(cityFromZip("1234"), "your area"); // Too short
});

Deno.test("sanitizeEstimate - enforces itemized math", () => {
  const input = {
    summary: {
      estimated_min_total: 1000,
      estimated_max_total: 2000,
      confidence_score: 4,
    },
    scope_items: [
      {
        quantity: 10,
        unit_cost_min: 100,
        unit_cost_max: 200,
        total_cost_min: 5, // Hallucinated/wrong
        total_cost_max: 5, // Hallucinated/wrong
        category: "Test",
        description: "Test description",
      },
    ],
    explanations: ["Test explanation"],
  };

  const result = sanitizeEstimate(input, "mid", false);

  // Math should be corrected: 10 * 100 = 1000
  assertEquals(result.scope_items[0].total_cost_min, 1000);
  assertEquals(result.scope_items[0].total_cost_max, 2000);
});

Deno.test("sanitizeEstimate - handles extreme values gracefully", () => {
  const input = {
    summary: { estimated_min_total: 0, estimated_max_total: 0 },
    scope_items: [
      {
        quantity: 1000000,
        unit_cost_min: 100,
        unit_cost_max: 200,
      },
    ],
  };

  const result = sanitizeEstimate(input as any, "premium", false);

  assertEquals(result.summary.estimated_min_total, 100000000); // 100M
  assertEquals(result.summary.estimated_max_total, 200000000); // 200M
});

Deno.test("sanitizeEstimate - syncs summary totals if they drift", () => {
  const input = {
    summary: {
      estimated_min_total: 5000, // Way off
      estimated_max_total: 6000, // Way off
      confidence_score: 4,
    },
    scope_items: [
      {
        quantity: 1,
        unit_cost_min: 1000,
        unit_cost_max: 2000,
        total_cost_min: 1000,
        total_cost_max: 2000,
      },
    ],
    explanations: [],
  };

  const result = sanitizeEstimate(input, "mid", false);

  // Summary should be updated to match the sum of items (1000 and 2000)
  assertEquals(result.summary.estimated_min_total, 1000);
  assertEquals(result.summary.estimated_max_total, 2000);
});

Deno.test("sanitizeEstimate - handles missing or corrupt summary", () => {
  const input = {
    scope_items: [
      {
        quantity: 5,
        unit_cost_min: 10,
        unit_cost_max: 20,
      },
    ],
  };

  const result = sanitizeEstimate(input as any, "economy", true);

  assertEquals(result.summary.estimated_min_total, 50);
  assertEquals(result.summary.estimated_max_total, 100);
  assertEquals(result.summary.confidence_score, 3); // Default
  assertEquals(result.scope_items[0].source, "photo");
});

Deno.test("sanitizeEstimate - sanitizes materials list", () => {
  const input = {
    summary: { estimated_min_total: 0, estimated_max_total: 0 },
    scope_items: [
      {
        quantity: 1,
        unit_cost_min: 100,
        unit_cost_max: 200,
        materials: [
          { name: "M1", brand: "B1", quantity: "2", unit: "bags" }, // String quantity should become number
          { name: null }, // Null name should become "Material"
        ],
      },
    ],
  };

  const result = sanitizeEstimate(input as any, "mid", false);

  assertEquals(result.scope_items[0].materials?.[0].quantity, 2);
  assertEquals(result.scope_items[0].materials?.[1].name, "Material");
});
