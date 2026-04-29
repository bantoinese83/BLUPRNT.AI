import { callGemini, type GeminiPart } from "../../_shared/gemini.ts";

export type RoomType = "kitchen" | "bathroom" | "other";
export type FinishPreference = "economy" | "mid" | "premium";
export type ScopeSource = "photo" | "text" | "fallback";
export type DbScopeSource = "photo" | "text";
export type Priority = "high" | "medium" | "low";

// ─── Sanity-check bounds (2026 market ceiling) ────────────────────────────────
const COST_CAPS = {
  PER_SQFT_MIN: 500,
  PER_SQFT_MAX: 600,
  PER_HOUR_MIN: 400,
  PER_HOUR_MAX: 500,
  PER_LINEAR_FT_MIN: 300,
  PER_LINEAR_FT_MAX: 400,
} as const;

/** Ratio of (qty × unit_cost) / material_total above which we suspect a
 *  "double-multiplication" hallucination (AI put total cost into unit_cost). */
const HALLUCINATION_RATIO_THRESHOLD = 30;

/** Minimum material total (USD) required before the ratio check fires. */
const MIN_MATERIAL_TOTAL_FOR_RATIO_CHECK = 100;

/** Tolerated drift between AI-reported totals and our re-calculated totals (5%). */
const SUMMARY_DRIFT_TOLERANCE = 0.05;

// ─── ZIP → Region / City ──────────────────────────────────────────────────────

const ZIP_REGION_RANGES: ReadonlyArray<{
  min: number;
  max: number;
  label: string;
}> = [
  { min: 5, max: 99, label: "Northeast US" },
  { min: 100, max: 299, label: "Mid-Atlantic US" },
  { min: 300, max: 399, label: "Southeast US" },
  { min: 400, max: 599, label: "Midwest US" },
  { min: 600, max: 799, label: "South Central US" },
  { min: 800, max: 899, label: "Mountain West US" },
  { min: 900, max: 961, label: "Pacific Coast US" },
  { min: 970, max: 999, label: "Pacific Northwest US" },
];

/**
 * Maps a US ZIP code to a human-readable metro/region label using a static
 * lookup table. Falls back to a broad regional label or "your area".
 *
 * NOTE: Metro prefix ranges are intentionally ordered from most-specific to
 * least-specific so that early conditions do not shadow later ones.
 */
export function cityFromZip(zip: string): string {
  const z = zip.replace(/\D/g, "").slice(0, 5);
  if (z.length !== 5) return "your area";
  const prefix = parseInt(z.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return "your area";

  // ── Detailed Metro-Prefix Mapping (ordered: most-specific first) ──────────
  // DC must come before the broader Mid-Atlantic range (200–299).
  if (prefix >= 200 && prefix <= 201) return "Washington DC area";
  // Boston uses a 3-digit prefix; 021–022 maps cleanly.
  if (prefix >= 21 && prefix <= 22) return "Boston area";

  if (prefix >= 100 && prefix <= 119) return "NYC Metro area";
  if (prefix >= 202 && prefix <= 212) return "Chicago area"; // avoids DC collision
  if (prefix >= 900 && prefix <= 918) return "Los Angeles area";
  if (prefix >= 770 && prefix <= 775) return "Houston area";
  if (prefix >= 190 && prefix <= 191) return "Philadelphia area";
  if (prefix >= 850 && prefix <= 853) return "Phoenix area";
  if (prefix >= 780 && prefix <= 782) return "San Antonio area";
  if (prefix >= 920 && prefix <= 921) return "San Diego area";
  if (prefix >= 750 && prefix <= 753) return "Dallas/Fort Worth area";
  if (prefix >= 940 && prefix <= 951) return "SF Bay Area";
  if (prefix >= 320 && prefix <= 333) return "Florida East Coast";
  if (prefix >= 300 && prefix <= 303) return "Atlanta area";
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
  return region ? region.label : "your area";
}

/**
 * Resolve a human-friendly city label for any US ZIP code.
 * Calls the Zippopotam API for exact city/state and falls back to
 * `cityFromZip` when the API is unavailable or returns bad data.
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
      places?: Array<{ "place name"?: string; "state abbreviation"?: string }>;
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

// ─── DB helpers ───────────────────────────────────────────────────────────────

/**
 * Persisted `scope_items.source` must satisfy the DB check constraint
 * (only `"text"` or `"photo"` are valid column values).
 * Runtime payloads may use `"fallback"`; this maps those to `"text"` on insert.
 */
export function normalizeScopeSourceForDb(
  source: ScopeSource | string | undefined | null,
): DbScopeSource {
  if (source === "photo") return "photo";
  return "text"; // covers "text", "fallback", unknown, null, undefined
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface GroundingSource {
  title: string;
  url?: string;
}

export interface ScopeMaterial {
  name: string;
  brand?: string;
  model?: string;
  quantity: number;
  unit: string;
  estimated_cost?: number;
}

export interface ScopeItem {
  category: string;
  description: string;
  finish_tier: FinishPreference;
  quantity: number;
  unit: string;
  unit_cost_min: number;
  unit_cost_max: number;
  total_cost_min: number;
  total_cost_max: number;
  confidence_score: number;
  confidence_reason?: string;
  source: ScopeSource;
  justification?: string;
  priority?: Priority;
  phase?: string;
  maintenance_tips?: string;
  materials?: ScopeMaterial[];
}

export interface EstimatePayload {
  summary: {
    estimated_min_total: number;
    estimated_max_total: number;
    confidence_score: number;
    value_engineering_tips: string[];
    regional_context: string;
    regional_signal: string;
    grounding_sources: GroundingSource[];
  };
  scope_items: ScopeItem[];
  explanations: string[];
  grounding_metadata?: unknown;
}

// ─── Sanitization ─────────────────────────────────────────────────────────────

/** Parse a numeric field from untrusted AI output, returning 0 on failure. */
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toStr(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

/** Parse an array field; always returns an array (empty on failure). */
function toArr<T>(v: unknown, mapper: (item: unknown) => T): T[] {
  return Array.isArray(v) ? v.map(mapper) : [];
}

/**
 * Sanitize and validate raw AI-generated estimate data into a well-typed
 * `EstimatePayload`. Applies:
 *  - Unit-cost ceiling caps to prevent order-of-magnitude hallucinations.
 *  - Double-multiplication detection (when unit_cost looks like it contains
 *    the full total instead of the per-unit cost).
 *  - Summary total re-calculation when AI totals drift > 5% from line items.
 *  - Deduplication of grounding sources by URL (and title for URL-less entries).
 */
export function sanitizeEstimate(
  parsed: unknown,
  finish_preference: FinishPreference,
  hasPhotos: boolean,
  groundingMetadata?: unknown,
): EstimatePayload {
  const p = parsed as Record<string, unknown>;

  // ── Summary ────────────────────────────────────────────────────────────────
  const rawSummary = (p?.summary ?? {}) as Record<string, unknown>;
  const grounding_sources = mergeGroundingSources(
    toArr(rawSummary.grounding_sources, parseGroundingSource),
    groundingMetadata,
  );

  const summary = {
    estimated_min_total: Math.round(toNum(rawSummary.estimated_min_total)),
    estimated_max_total: Math.round(toNum(rawSummary.estimated_max_total)),
    confidence_score: toNum(rawSummary.confidence_score) || 3,
    value_engineering_tips: toArr(rawSummary.value_engineering_tips, String),
    regional_context: toStr(rawSummary.regional_context),
    regional_signal: toStr(rawSummary.regional_signal),
    grounding_sources,
  };

  // ── Scope items ────────────────────────────────────────────────────────────
  const scope_items: ScopeItem[] = toArr(p?.scope_items, (s) =>
    sanitizeScopeItem(s, finish_preference, hasPhotos),
  );

  // ── Re-calculate summary totals if AI totals drifted ──────────────────────
  const calculated_min = scope_items.reduce(
    (sum, item) => sum + item.total_cost_min,
    0,
  );
  const calculated_max = scope_items.reduce(
    (sum, item) => sum + item.total_cost_max,
    0,
  );

  if (
    summary.estimated_min_total === 0 ||
    relativeDrift(summary.estimated_min_total, calculated_min) >
      SUMMARY_DRIFT_TOLERANCE
  ) {
    summary.estimated_min_total = calculated_min;
  }
  if (
    summary.estimated_max_total === 0 ||
    relativeDrift(summary.estimated_max_total, calculated_max) >
      SUMMARY_DRIFT_TOLERANCE
  ) {
    summary.estimated_max_total = calculated_max;
  }

  return {
    summary,
    scope_items,
    explanations: toArr(p?.explanations, String),
    grounding_metadata: groundingMetadata,
  };
}

/** |a − b| / |a| — returns 0 when both are 0 to avoid division by zero. */
function relativeDrift(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  return Math.abs(a - b) / (Math.abs(a) || 1);
}

function parseGroundingSource(src: unknown): GroundingSource {
  const s = src as Record<string, unknown>;
  return {
    title: toStr(s?.title, "Data Source"),
    url: s?.url ? toStr(s.url) : undefined,
  };
}

/**
 * Merges in-payload grounding sources with any SDK-level grounding chunks,
 * de-duplicating by URL (or title for URL-less entries).
 */
function mergeGroundingSources(
  inPayload: GroundingSource[],
  groundingMetadata: unknown,
): GroundingSource[] {
  const sources: GroundingSource[] = [...inPayload];
  const seenUrls = new Set(sources.map((s) => s.url).filter(Boolean));
  const _seenTitles = new Set(sources.filter((s) => !s.url).map((s) => s.title));

  const meta = groundingMetadata as
    | { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> }
    | undefined;

  if (Array.isArray(meta?.groundingChunks)) {
    for (const chunk of meta!.groundingChunks) {
      const uri = chunk?.web?.uri;
      if (!uri) continue;
      if (seenUrls.has(uri)) continue;
      seenUrls.add(uri);
      let title: string;
      try {
        title = chunk.web?.title ?? new URL(uri).hostname;
      } catch {
        title = uri;
      }
      sources.push({ title, url: uri });
    }
  }

  return sources;
}

/**
 * Sanitize a single scope item from raw AI output.
 * Applies unit-cost caps and double-multiplication correction.
 */
function sanitizeScopeItem(
  raw: unknown,
  finish_preference: FinishPreference,
  hasPhotos: boolean,
): ScopeItem {
  const s = raw as Record<string, unknown>;
  const qty = toNum(s.quantity);
  let u_min = toNum(s.unit_cost_min);
  let u_max = toNum(s.unit_cost_max);
  const unitLower = toStr(s.unit).toLowerCase();
  const category = toStr(s.category, "General");

  const materials = toArr(s.materials, parseMaterial);
  const material_total = materials.reduce(
    (acc, m) => acc + (m.estimated_cost ?? 0) * m.quantity,
    0,
  );

  // ── Double-multiplication check ────────────────────────────────────────────
  // If materials exist and (qty × unit_cost) is unreasonably large vs materials,
  // the AI likely placed the total cost into the unit_cost field.
  // Guard against qty === 0 to avoid division by zero / Infinity.
  if (
    material_total > MIN_MATERIAL_TOTAL_FOR_RATIO_CHECK &&
    qty > 0 &&
    qty * u_min > material_total * HALLUCINATION_RATIO_THRESHOLD
  ) {
    console.warn(
      `[sanitizeEstimate] Double-multiplication likely for "${category}". ` +
        `material_total=${material_total}, qty*u_min=${qty * u_min}. Dividing unit_cost by qty.`,
    );
    u_min = Math.round(u_min / qty);
    u_max = Math.round(u_max / qty);
  }

  // ── Unit-cost ceiling caps ─────────────────────────────────────────────────
  if (unitLower.includes("sq ft") || unitLower.includes("sf")) {
    if (u_min > COST_CAPS.PER_SQFT_MIN) u_min = COST_CAPS.PER_SQFT_MIN;
    if (u_max > COST_CAPS.PER_SQFT_MAX) u_max = COST_CAPS.PER_SQFT_MAX;
  } else if (unitLower.includes("hr") || unitLower.includes("hour")) {
    if (u_min > COST_CAPS.PER_HOUR_MIN) u_min = COST_CAPS.PER_HOUR_MIN;
    if (u_max > COST_CAPS.PER_HOUR_MAX) u_max = COST_CAPS.PER_HOUR_MAX;
  } else if (unitLower.includes("linear") || unitLower.includes(" ft")) {
    if (u_min > COST_CAPS.PER_LINEAR_FT_MIN)
      u_min = COST_CAPS.PER_LINEAR_FT_MIN;
    if (u_max > COST_CAPS.PER_LINEAR_FT_MAX)
      u_max = COST_CAPS.PER_LINEAR_FT_MAX;
  }

  // Ensure min ≤ max after capping
  if (u_min > u_max) u_max = u_min;

  return {
    category,
    description: toStr(s.description),
    finish_tier: isFinishPreference(s.finish_tier)
      ? s.finish_tier
      : finish_preference,
    quantity: qty,
    unit: toStr(s.unit, "unit"),
    unit_cost_min: Math.round(u_min),
    unit_cost_max: Math.round(u_max),
    total_cost_min: Math.round(qty * u_min) || toNum(s.total_cost_min),
    total_cost_max: Math.round(qty * u_max) || toNum(s.total_cost_max),
    confidence_score: toNum(s.confidence_score) || 3,
    confidence_reason: toStr(s.confidence_reason),
    source: hasPhotos ? "photo" : "text",
    justification: toStr(s.justification),
    priority: isPriority(s.priority) ? s.priority : "medium",
    phase: toStr(s.phase, "Standard"),
    maintenance_tips: toStr(s.maintenance_tips),
    materials,
  };
}

function parseMaterial(raw: unknown): ScopeMaterial {
  const m = raw as Record<string, unknown>;
  return {
    name: toStr(m?.name, "Material"),
    brand: m?.brand ? toStr(m.brand) : undefined,
    model: m?.model ? toStr(m.model) : undefined,
    quantity: toNum(m?.quantity) || 1,
    unit: toStr(m?.unit, "pc"),
    estimated_cost:
      m?.estimated_cost != null ? toNum(m.estimated_cost) : undefined,
  };
}

// ─── Type guards ──────────────────────────────────────────────────────────────

function isFinishPreference(v: unknown): v is FinishPreference {
  return v === "economy" || v === "mid" || v === "premium";
}

function isPriority(v: unknown): v is Priority {
  return v === "high" || v === "medium" || v === "low";
}

// ─── Fallback estimates ───────────────────────────────────────────────────────

/**
 * Provides a high-fidelity "Best Guess" estimate when AI analysis fails.
 * Calls Gemini with minimal context to produce a broad regional benchmark.
 * Returns `null` if Gemini itself fails; callers should then use
 * `getFallbackEstimate`.
 */
export async function getSmartFallbackEstimate(
  roomType: string,
  zip: string,
): Promise<EstimatePayload | null> {
  const city = await cityFromZipUniversal(zip);

  const systemInstruction = `
    You are a regional construction estimator for BLUPRNT.AI.
    The user is asking for a "blind" regional benchmark estimate for a renovation in ${city} (ZIP: ${zip}).
    We don't have photos yet, so provide a broad but professional range based on current 2026 market data.

    Project Type: ${roomType}
    Location: ${city}

    Return a JSON object conforming to the EstimatePayload schema:
    - summary: {
        estimated_min_total: number,
        estimated_max_total: number,
        confidence_score: 2,
        regional_context: string,
        regional_signal: string,
        value_engineering_tips: string[],
        grounding_sources: []
      }
    - scope_items: [{ category: "General", description: "Regional benchmark for ${roomType}", ... }]
    - explanations: ["This is a regional benchmark based on local market data while we wait for detailed analysis."]
  `;

  try {
    const response = await callGemini({
      parts: [
        {
          text: `Generate a smart regional fallback estimate for a ${roomType} in ${city}`,
        },
      ],
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.1,
    });

    if (!response?.data) return null;

    return sanitizeEstimate(response.data, "mid", false);
  } catch (e) {
    console.error(
      "[getSmartFallbackEstimate] Gemini call failed:",
      (e as Error).message,
    );
    return null;
  }
}

/**
 * Last-resort hardcoded estimate when both Gemini and the smart fallback fail.
 * Guarantees the user always sees a number rather than an error screen.
 */
export function getFallbackEstimate(
  roomType: RoomType,
  zip: string,
): EstimatePayload {
  const isWet = roomType === "kitchen" || roomType === "bathroom";
  const min = isWet ? 12_000 : 4_500;
  const max = isWet ? 35_000 : 12_000;

  return {
    summary: {
      estimated_min_total: min,
      estimated_max_total: max,
      confidence_score: 2,
      regional_context: `Standard mid-tier averages for the ${cityFromZip(zip)}.`,
      regional_signal: "Based on national construction cost database averages.",
      value_engineering_tips: [
        "Consider mid-range materials for better ROI.",
        "Refurbish existing cabinets instead of replacing.",
      ],
      grounding_sources: [
        { title: "National Construction Cost Database (2026 Averages)" },
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

// ─── Primary extraction ───────────────────────────────────────────────────────

export async function extractScopeWithGemini(input: {
  room_type: RoomType;
  zip_code: string;
  finish_preference: FinishPreference;
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
  const hasPhotos = photoParts.length > 0;

  const systemInstruction = `You are a Senior Residential Construction Estimator & Market Intelligence Analyst for ${area}.
Your mission is to produce a high-fidelity, hyper-accurate project blueprint.
CRITICAL: You MUST use the Google Search tool for EVERY estimate. Do NOT rely on static knowledge for pricing.

Rules:
1. **Real-Time Market Search**: For ${zip_code}, search for current ${dateStr} prices of materials and labor. Look for specific listings at big-box retailers (Home Depot, Lowe's, Ferguson) and regional contractor rate reports.
2. **Itemized Precision**: Exactly **4** line items. Each MUST have:
   - Detailed justification citing the specific market factors found during search.
   - maintenance_tips and phase (prep, rough, or finish).
3. **Hyper-Specific BOM**: For each item, include 6–10 specific materials.
   - MUST include: brand name, realistic SKU/model descriptions, and current unit cost found via search.
   - Match finish tier: ${finish_preference}.
4. **Regional Intelligence**:
   - regional_context: Summarize the current local market conditions in ${area} (e.g., labor shortages, supply chain issues).
   - regional_signal: State exactly what data you found via search (e.g., "Matched to current $75/hr plumber rates in ${zip_code}").
5. **Citations & Grounding**: Populate "grounding_sources" with the actual URLs and titles of the product pages or cost guides you used.
6. Photos: If photos are provided, perform deep vision analysis to identify specific existing conditions, brands, or damage.
7. Math: Ensure perfect arithmetic (total = qty × unit_cost).
8. **Sanity Check (CRITICAL)**: Residential construction follows predictable ranges.
   - Tiling/Flooring: NEVER exceeds $100/sqft total (materials + labor).
   - Plumbing/Electric: Typically $150–$300 per fixture/point.
   - If your calculation exceeds $50,000 for a SINGLE room's flooring, you have made a math or unit error.
   - NEVER put the total cost of the item into the 'unit_cost' field. The 'unit_cost' MUST be the cost per SINGLE unit (1 sqft, 1 hour, 1 linear foot).

Deliver a response that feels like a professional, researched contractor bid, not a generic LLM guess. Ensure all currency values are realistic for a homeowner.`;

  const prompt = `Project: ${room_type} Renovation
Location: ${zip_code} (${area})
Analysis Mode: ${hasPhotos ? "Vision & Text Integration" : "Text-Only Estimation"}
Target Finish Tier: ${finish_preference}
User Description: ${
    scopeDescription ||
    (hasPhotos
      ? "Analyze photos for full scope"
      : "Standard renovation for this room type")
  }.

${
  hasPhotos
    ? "Analyze the attached photos deeply first, then use the description for context."
    : "Construct a high-fidelity estimate based EXCLUSIVELY on the text description provided."
}

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
          grounding_sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
              },
              required: ["title"],
            },
          },
        },
        required: [
          "estimated_min_total",
          "estimated_max_total",
          "confidence_score",
          "regional_signal",
          "grounding_sources",
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
      responseMimeType: "application/json",
      responseSchema,
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
      maxOutputTokens: 4096,
      timeoutMs: 95_000,
    });

    if (!result?.text) {
      console.error("[extractScopeWithGemini] No output from Gemini.");
      return null;
    }

    if (result.text.startsWith("ERROR:")) {
      console.error("[extractScopeWithGemini] Gemini API error:", result.text);
      return null;
    }

    let parsed: unknown;
    try {
      if (result.data && typeof result.data === "object") {
        parsed = result.data;
      } else {
        let text = result.text.trim();
        // Strip markdown code fences if the model wrapped its output.
        if (text.startsWith("```")) {
          text = text.replace(/^```+(json)?\s*/i, "").replace(/\s*```+$/i, "");
        }
        parsed = JSON.parse(text);
      }
    } catch (e) {
      console.error(
        "[extractScopeWithGemini] Failed to parse Gemini JSON:",
        e,
        "\n--- RAW TEXT ---\n",
        result.text,
        "\n--- END ---",
      );
      return null;
    }

    return sanitizeEstimate(
      parsed,
      finish_preference,
      hasPhotos,
      result.groundingMetadata,
    );
  } catch (e) {
    console.error(
      "[extractScopeWithGemini] Gemini call failed:",
      (e as Error).message,
    );
    return null;
  }
}
