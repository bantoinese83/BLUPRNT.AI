import { callGemini, type GeminiPart } from "../../_shared/gemini.ts";

export type RoomType = "kitchen" | "bathroom" | "other";

const ZIP_REGION_RANGES: Array<{ min: number; max: number; label: string }> = [
  { min: 5, max: 99, label: "Northeast US" },
  { min: 100, max: 299, label: "Mid-Atlantic US" },
  { min: 300, max: 399, label: "Southeast US" },
  { min: 400, max: 599, label: "Midwest US" },
  { min: 600, max: 799, label: "South Central US" },
  { min: 800, max: 899, label: "Mountain West US" },
  { min: 900, max: 961, label: "Pacific Coast US" },
  { min: 970, max: 999, label: "Pacific Northwest US" },
];

export function cityFromZip(zip: string): string {
  const z = zip.replace(/\D/g, "").slice(0, 5);
  if (z.length !== 5) return "your area";
  const prefix = parseInt(z.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return "your area";

  // Detailed Metro-Prefix Mapping (Top 30+ US Markets)
  if (prefix >= 100 && prefix <= 119) return "NYC Metro area"; // NYC / Long Island
  if (prefix >= 200 && prefix <= 212) return "Chicago area";
  if (prefix >= 900 && prefix <= 918) return "Los Angeles area";
  if (prefix >= 770 && prefix <= 775) return "Houston area";
  if (prefix >= 190 && prefix <= 191) return "Philadelphia area";
  if (prefix >= 850 && prefix <= 853) return "Phoenix area";
  if (prefix >= 780 && prefix <= 782) return "San Antonio area";
  if (prefix >= 920 && prefix <= 921) return "San Diego area";
  if (prefix >= 750 && prefix <= 753) return "Dallas/Fort Worth area";
  if (prefix >= 940 && prefix <= 951) return "SF Bay Area";
  if (prefix >= 320 && prefix <= 333) return "Florida East Coast"; // Miami/Ft Lauderdale
  if (prefix >= 300 && prefix <= 303) return "Atlanta area";
  if (prefix >= 200 && prefix <= 201) return "Washington DC area";
  if (prefix >= 21 && prefix <= 22) return "Boston area";
  if (prefix >= 480 && prefix <= 483) return "Detroit area";
  if (prefix >= 980 && prefix <= 981) return "Seattle area";
  if (prefix >= 550 && prefix <= 555) return "Minneapolis/St Paul";
  if (prefix >= 800 && prefix <= 802) return "Denver area";
  if (prefix >= 275 && prefix <= 277) return "Research Triangle (NC)";
  if (prefix >= 370 && prefix <= 372) return "Nashville area";
  if (prefix >= 890 && prefix <= 891) return "Las Vegas area";
  if (prefix >= 430 && prefix <= 432) return "Columbus area";
  if (prefix >= 460 && prefix <= 462) return "Indianapolis area";
  if (prefix >= 530 && prefix <= 532) return "Milwaukee area";
  if (prefix >= 630 && prefix <= 631) return "St. Louis area";
  if (prefix >= 327 && prefix <= 328) return "Orlando area";
  if (prefix >= 970 && prefix <= 972) return "Portland area";
  if (prefix >= 730 && prefix <= 731) return "Oklahoma City area";
  if (prefix >= 840 && prefix <= 841) return "Salt Lake City area";
  if (prefix >= 600 && prefix <= 606) return "Chicago North Suburban";
  if (prefix >= 926 && prefix <= 928) return "Orange County area";
  if (prefix >= 335 && prefix <= 337) return "Tampa Bay area";

  const region = ZIP_REGION_RANGES.find(
    (r) => prefix >= r.min && prefix <= r.max,
  );
  if (region) return region.label;

  return "your area";
}

/**
 * Resolve a human-friendly city label for any US ZIP code.
 * Falls back to `cityFromZip` when the lookup API is unavailable.
 */
export async function cityFromZipUniversal(zip: string): Promise<string> {
  const z = zip.replace(/\D/g, "").slice(0, 5);
  if (z.length !== 5) return "your area";

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${z}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return cityFromZip(z);
    const data = (await res.json()) as {
      places?: Array<{
        "place name"?: string;
        "state abbreviation"?: string;
      }>;
    };
    const place = data.places?.[0];
    const city = place?.["place name"]?.trim();
    const state = place?.["state abbreviation"]?.trim();
    if (city && state) return `${city}, ${state} area`;
    if (city) return `${city} area`;
    return cityFromZip(z);
  } catch {
    return cityFromZip(z);
  }
}

/**
 * Persisted `scope_items.source` must satisfy DB check (e.g. text | photo only).
 * Runtime payloads may use `fallback`; map those to `text` on insert.
 */
export function normalizeScopeSourceForDb(
  source: string | undefined | null,
): "text" | "photo" {
  if (source === "photo") return "photo";
  return "text";
}

export interface EstimatePayload {
  summary: {
    estimated_min_total: number;
    estimated_max_total: number;
    confidence_score: number;
    value_engineering_tips?: string[];
    regional_context?: string;
    regional_signal?: string; // e.g., "Matched to 2026 Material Costs in Austin"
  };
  scope_items: Array<{
    category: string;
    description: string;
    finish_tier: "economy" | "mid" | "premium";
    quantity: number;
    unit: string;
    unit_cost_min: number;
    unit_cost_max: number;
    total_cost_min: number;
    total_cost_max: number;
    confidence_score: number;
    confidence_reason?: string;
    source: "photo" | "text" | "fallback";
    justification?: string;
    priority?: "high" | "medium" | "low";
    phase?: string;
    maintenance_tips?: string;
    materials?: Array<{
      name: string;
      brand?: string;
      model?: string;
      quantity?: number;
      unit?: string;
      estimated_cost?: number;
    }>;
  }>;
  explanations: string[];
}

export function sanitizeEstimate(
  parsed: any,
  finish_preference: string,
  hasPhotos: boolean,
): EstimatePayload {
  const summary = {
    estimated_min_total: Math.round(
      Number(parsed.summary?.estimated_min_total || 0),
    ),
    estimated_max_total: Math.round(
      Number(parsed.summary?.estimated_max_total || 0),
    ),
    confidence_score: Number(parsed.summary?.confidence_score || 3),
    value_engineering_tips: Array.isArray(
      parsed.summary?.value_engineering_tips,
    )
      ? parsed.summary.value_engineering_tips.map(String)
      : [],
    regional_context: String(parsed.summary?.regional_context || ""),
    regional_signal: String(parsed.summary?.regional_signal || ""),
  };

  const scope_items = (
    Array.isArray(parsed.scope_items) ? parsed.scope_items : []
  ).map((s: any) => {
    const qty = Number(s.quantity || 0);
    const u_min = Number(s.unit_cost_min || 0);
    const u_max = Number(s.unit_cost_max || 0);

    // Enforce math: total = qty * unit_cost
    const t_min = Math.round(qty * u_min);
    const t_max = Math.round(qty * u_max);

    return {
      category: String(s.category || "General"),
      description: String(s.description || ""),
      finish_tier: (s.finish_tier as any) || finish_preference,
      quantity: qty,
      unit: String(s.unit || "unit"),
      unit_cost_min: Math.round(u_min),
      unit_cost_max: Math.round(u_max),
      total_cost_min: t_min,
      total_cost_max: t_max,
      confidence_score: Number(s.confidence_score || 3),
      confidence_reason: String(s.confidence_reason || ""),
      source: hasPhotos ? ("photo" as const) : ("text" as const),
      justification: String(s.justification || ""),
      priority: (s.priority as any) || "medium",
      phase: String(s.phase || "Standard"),
      maintenance_tips: String(s.maintenance_tips || ""),
      materials: Array.isArray(s.materials)
        ? s.materials.map((m: any) => ({
            name: String(m.name || "Material"),
            brand: m.brand ? String(m.brand) : undefined,
            model: m.model ? String(m.model) : undefined,
            quantity: Number(m.quantity || 1),
            unit: String(m.unit || "pc"),
            estimated_cost: m.estimated_cost
              ? Number(m.estimated_cost)
              : undefined,
          }))
        : [],
    };
  });

  // Re-calculate summary totals based on itemized rows if they drifted
  const calculated_min = scope_items.reduce(
    (sum: number, item: any) => sum + item.total_cost_min,
    0,
  );
  const calculated_max = scope_items.reduce(
    (sum: number, item: any) => sum + item.total_cost_max,
    0,
  );

  // If AI total is significantly off (> 5%), use ours. Otherwise trust AI's rounding/contingency.
  if (
    summary.estimated_min_total === 0 ||
    Math.abs(summary.estimated_min_total - calculated_min) /
      (summary.estimated_min_total || 1) >
      0.05
  ) {
    summary.estimated_min_total = calculated_min;
  }
  if (
    summary.estimated_max_total === 0 ||
    Math.abs(summary.estimated_max_total - calculated_max) /
      (summary.estimated_max_total || 1) >
      0.05
  ) {
    summary.estimated_max_total = calculated_max;
  }

  return {
    summary,
    scope_items,
    explanations: Array.isArray(parsed.explanations)
      ? parsed.explanations.map(String)
      : [],
  };
}

/**
 * Provides a high-fidelity 'Best Guess' estimate when AI analysis fails.
 * Ensures the user experiences zero downtime even if the LLM is overloaded.
 */
export function getFallbackEstimate(
  roomType: RoomType,
  zip: string,
): EstimatePayload {
  const isWet = roomType === "kitchen" || roomType === "bathroom";
  const min = isWet ? 12000 : 4500;
  const max = isWet ? 35000 : 12000;

  return {
    summary: {
      estimated_min_total: min,
      estimated_max_total: max,
      confidence_score: 2,
      regional_context: `Standard mid-tier averages for the ${cityFromZip(zip)}.`,
      value_engineering_tips: [
        "Consider mid-range materials for better ROI.",
        "Refurbish existing cabinets instead of replacing.",
      ],
    },
    scope_items: [
      {
        category: "General",
        description: `Standard ${roomType} refresh and renovation items.`,
        finish_tier: "mid",
        quantity: 1,
        unit: "lot",
        unit_cost_min: min,
        unit_cost_max: max,
        total_cost_min: min,
        total_cost_max: max,
        confidence_score: 1,
        source: "fallback",
        justification: "Calculated based on regional mid-market averages.",
        materials: [],
      },
    ],
    explanations: [
      "This is a regional average estimate provided because our deep vision analysis was unable to process your specific photos at this time.",
    ],
  };
}

export async function extractScopeWithGemini(input: {
  room_type: RoomType;
  zip_code: string;
  finish_preference: "economy" | "mid" | "premium";
  scopeDescription?: string | null;
  photoParts?: GeminiPart[];
}): Promise<EstimatePayload | null> {
  const {
    room_type,
    zip_code,
    finish_preference,
    scopeDescription,
    photoParts = [],
  } = input;
  const area = await cityFromZipUniversal(zip_code);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const systemInstruction = `You are a Senior Residential Construction Estimator for ${area}.
Produce a concise, accurate renovation scope-budget JSON. Speed matters: be thorough but avoid unnecessary verbosity.

Rules:
1. Exactly **4** line items, grouped by phase (prep → rough → finish). Each item: clear description, justification, priority (high/medium/low), confidence_reason, maintenance_tips, phase.
2. **Materials**: 3–8 key SKUs per line item (name, brand optional, quantity, unit). Match finish tier (${finish_preference}). No empty materials arrays.
3. Summary: estimated_min_total, estimated_max_total, confidence_score (1–5), value_engineering_tips (2–4 strings), regional_context (${area}, ${dateStr}), regional_signal (one concrete line).
4. Math: total_cost_min = quantity * unit_cost_min (same for max).
5. Photos: call out only what you can see; set verification_required true if unsure.
6. Text-only (no photos): infer a plausible scope from the user description + ${area} norms.
7. Prefer shorter sentences so the model finishes within a tight latency budget.`;

  const hasPhotos = photoParts.length > 0;
  const prompt = `Project: ${room_type} Renovation
Location: ${zip_code} (${area})
Analysis Mode: ${hasPhotos ? "Vision & Text Integration" : "Text-Only Estimation"}
Target Finish Tier: ${finish_preference}
User Description: ${scopeDescription || (hasPhotos ? "Analyze photos for full scope" : "Standard renovation for this room type")}.

${hasPhotos ? "Analyze the attached photos deeply first, then use the description for context." : "Construct a high-fidelity estimate based EXCLUSIVELY on the text description provided."}

Please generate the detailed blueprint.`;

  const responseSchema = {
    type: "object",
    properties: {
      summary: {
        type: "object",
        properties: {
          estimated_min_total: { type: "number" },
          estimated_max_total: { type: "number" },
          confidence_score: { type: "number", description: "1 to 5" },
          value_engineering_tips: { type: "array", items: { type: "string" } },
          regional_context: { type: "string" },
          regional_signal: { type: "string" },
        },
        required: [
          "estimated_min_total",
          "estimated_max_total",
          "confidence_score",
          "regional_signal",
        ],
      },
      scope_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            materials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  brand: { type: "string" },
                  model: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" },
                  estimated_cost: { type: "number" },
                },
                required: ["name", "quantity", "unit"],
              },
            },
            description: { type: "string" },
            finish_tier: {
              type: "string",
              enum: ["economy", "mid", "premium"],
            },
            quantity: { type: "number" },
            unit: { type: "string" },
            unit_cost_min: { type: "number" },
            unit_cost_max: { type: "number" },
            total_cost_min: { type: "number" },
            total_cost_max: { type: "number" },
            confidence_score: { type: "number" },
            confidence_reason: { type: "string" },
            justification: { type: "string" },
            verification_required: { type: "boolean" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            phase: { type: "string" },
            maintenance_tips: { type: "string" },
          },
          required: [
            "category",
            "description",
            "finish_tier",
            "quantity",
            "unit",
            "unit_cost_min",
            "unit_cost_max",
            "total_cost_min",
            "total_cost_max",
            "justification",
            "priority",
            "phase",
            "confidence_reason",
            "materials",
          ],
        },
      },
      explanations: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["summary", "scope_items", "explanations"],
  };

  const parts: GeminiPart[] = [{ text: prompt }, ...photoParts];

  try {
    const result = await callGemini({
      parts,
      systemInstruction,
      responseSchema,
      temperature: 0.1,
      maxOutputTokens: 4096,
      timeoutMs: 95_000,
    });

    if (!result?.text) {
      console.error("[extractScopeWithGemini] No output from Gemini.");
      return null;
    }

    if (result.text.startsWith("ERROR:")) {
      console.error("Gemini API reported error:", result.text);
      return null;
    }

    let parsed: any;
    try {
      if (result.data && typeof result.data === "object") {
        parsed = result.data;
      } else {
        let text = result.text.trim();
        // Strip markdown code block wrapping if present
        if (text.startsWith("```")) {
          text = text.replace(/^```+(json)?\s*/i, "").replace(/\s*```+$/i, "");
        }
        parsed = JSON.parse(text);
      }
    } catch (e) {
      console.error(
        "Failed to parse Gemini JSON:",
        e,
        "\n--- RAW TEXT START ---\n",
        result.text,
        "\n--- RAW TEXT END ---",
      );
      return null;
    }

    return sanitizeEstimate(parsed, finish_preference, hasPhotos);
  } catch (e: unknown) {
    const error = e as Error;
    console.error("Gemini scope extraction failed:", error.message);
    return null;
  }
}
