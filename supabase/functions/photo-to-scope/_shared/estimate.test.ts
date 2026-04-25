import { assertEquals, assertExists } from "std/assert";
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
  assertEquals(result.scope_items[0]!.total_cost_min, 1000);
  assertEquals(result.scope_items[0]!.total_cost_max, 2000);
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

  // deno-lint-ignore no-explicit-any
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

  // deno-lint-ignore no-explicit-any
  const result = sanitizeEstimate(input as any, "economy", true);

  assertEquals(result.summary.estimated_min_total, 50);
  assertEquals(result.summary.estimated_max_total, 100);
  assertEquals(result.summary.confidence_score, 3); // Default
  assertEquals(result.scope_items[0]!.source, "photo");
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
          { name: "M1", brand: "B1", quantity: "2", unit: "bags" }, // String quantity → number
          { name: null }, // Null name → "Material"
        ],
      },
    ],
  };

  // deno-lint-ignore no-explicit-any
  const result = sanitizeEstimate(input as any, "mid", false);

  assertEquals(result.scope_items[0]!.materials?.[0]!.quantity, 2);
  assertEquals(result.scope_items[0]!.materials?.[1]!.name, "Material");
});

// ────────────────────────────────────────────────────────────────────────────
// Grounding metadata integration tests
// ────────────────────────────────────────────────────────────────────────────

Deno.test(
  "sanitizeEstimate - works without groundingMetadata argument",
  () => {
    const input = {
      summary: {
        estimated_min_total: 5000,
        estimated_max_total: 8000,
        confidence_score: 4,
        grounding_sources: [],
      },
      scope_items: [],
      explanations: [],
    };

    const result = sanitizeEstimate(input, "mid", false);

    assertEquals(result.summary.grounding_sources.length, 0);
    assertEquals(result.grounding_metadata, undefined);
  },
);

Deno.test(
  "sanitizeEstimate - merges SDK grounding chunks into grounding_sources",
  () => {
    const input = {
      summary: {
        estimated_min_total: 5000,
        estimated_max_total: 8000,
        confidence_score: 4,
        grounding_sources: [
          { title: "Home Depot Tile", url: "https://homedepot.com/tile" },
        ],
      },
      scope_items: [],
      explanations: [],
    };

    const groundingMetadata = {
      groundingChunks: [
        {
          web: {
            uri: "https://lowes.com/flooring",
            title: "Lowe's Flooring Prices",
          },
        },
        {
          web: {
            uri: "https://homedepot.com/tile", // duplicate — should be de-duped
            title: "Home Depot Tile",
          },
        },
      ],
    };

    const result = sanitizeEstimate(input, "mid", false, groundingMetadata);

    // 2 sources: original + 1 new (lowes), de-duped (homedepot)
    assertEquals(result.summary.grounding_sources.length, 2);
    assertEquals(
      result.summary.grounding_sources[0]!.url,
      "https://homedepot.com/tile",
    );
    assertEquals(
      result.summary.grounding_sources[1]!.url,
      "https://lowes.com/flooring",
    );
    assertEquals(
      result.summary.grounding_sources[1]!.title,
      "Lowe's Flooring Prices",
    );
  },
);

Deno.test(
  "sanitizeEstimate - handles grounding chunk without a title (falls back to hostname)",
  () => {
    const input = {
      summary: {
        estimated_min_total: 3000,
        estimated_max_total: 5000,
        confidence_score: 3,
        grounding_sources: [],
      },
      scope_items: [],
      explanations: [],
    };

    const groundingMetadata = {
      groundingChunks: [
        {
          web: {
            uri: "https://bls.gov/labor-rates",
            // No title — should fall back to hostname
          },
        },
      ],
    };

    const result = sanitizeEstimate(input, "mid", false, groundingMetadata);

    assertEquals(result.summary.grounding_sources.length, 1);
    assertEquals(
      result.summary.grounding_sources[0]!.url,
      "https://bls.gov/labor-rates",
    );
    assertEquals(result.summary.grounding_sources[0]!.title, "bls.gov");
  },
);

Deno.test(
  "sanitizeEstimate - ignores grounding chunks without a web URI",
  () => {
    const input = {
      summary: {
        estimated_min_total: 3000,
        estimated_max_total: 5000,
        confidence_score: 3,
        grounding_sources: [],
      },
      scope_items: [],
      explanations: [],
    };

    const groundingMetadata = {
      groundingChunks: [
        { web: {} }, // no uri
        { nonWeb: { something: "else" } }, // not a web chunk
      ],
    };

    const result = sanitizeEstimate(input, "mid", false, groundingMetadata);

    assertEquals(result.summary.grounding_sources.length, 0);
  },
);

Deno.test(
  "sanitizeEstimate - attaches raw grounding_metadata to payload",
  () => {
    const input = {
      summary: {
        estimated_min_total: 4000,
        estimated_max_total: 6000,
        confidence_score: 5,
        grounding_sources: [],
      },
      scope_items: [],
      explanations: [],
    };

    const groundingMetadata = {
      groundingChunks: [],
      webSearchQueries: ["kitchen remodel cost 10001 2026"],
    };

    const result = sanitizeEstimate(input, "premium", false, groundingMetadata);

    assertExists(result.grounding_metadata);
    // deno-lint-ignore no-explicit-any
    assertEquals((result.grounding_metadata as any).webSearchQueries?.[0], "kitchen remodel cost 10001 2026");
  },
);

Deno.test(
  "sanitizeEstimate - sanitizes grounding_sources from AI JSON",
  () => {
    const input = {
      summary: {
        estimated_min_total: 2000,
        estimated_max_total: 4000,
        confidence_score: 4,
        grounding_sources: [
          { title: 123, url: 456 }, // Non-string fields coerced
          { title: null }, // Null title → "Data Source"
          { title: "Ferguson Bath", url: "https://ferguson.com/bath" },
        ],
      },
      scope_items: [],
      explanations: [],
    };

    // deno-lint-ignore no-explicit-any
    const result = sanitizeEstimate(input as any, "mid", false);

    assertEquals(result.summary.grounding_sources[0]!.title, "123");
    assertEquals(result.summary.grounding_sources[0]!.url, "456");
    assertEquals(result.summary.grounding_sources[1]!.title, "Data Source");
    assertEquals(result.summary.grounding_sources[1]!.url, undefined);
    assertEquals(result.summary.grounding_sources[2]!.title, "Ferguson Bath");
    assertEquals(
      result.summary.grounding_sources[2]!.url,
      "https://ferguson.com/bath",
    );
  },
);

Deno.test(
  "sanitizeEstimate - value_engineering_tips and regional fields are preserved",
  () => {
    const input = {
      summary: {
        estimated_min_total: 8000,
        estimated_max_total: 12000,
        confidence_score: 4,
        value_engineering_tips: ["Use stock cabinets", "Defer backsplash"],
        regional_context: "Austin, TX market is competitive in Q2 2026",
        regional_signal: "Matched $85/hr labor rate from BLS Austin data",
        grounding_sources: [],
      },
      scope_items: [],
      explanations: ["Cost driven by tile selection"],
    };

    const result = sanitizeEstimate(input, "mid", false);

    assertEquals(result.summary.value_engineering_tips.length, 2);
    assertEquals(
      result.summary.value_engineering_tips[0],
      "Use stock cabinets",
    );
    assertEquals(
      result.summary.regional_context,
      "Austin, TX market is competitive in Q2 2026",
    );
    assertEquals(
      result.summary.regional_signal,
      "Matched $85/hr labor rate from BLS Austin data",
    );
    assertEquals(result.explanations[0], "Cost driven by tile selection");
  },
);
