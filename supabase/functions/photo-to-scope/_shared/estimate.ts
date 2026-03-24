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

  // Keep a few trusted city-level labels where we know they are helpful.
  if (prefix >= 900 && prefix <= 916) return "Los Angeles area";
  if (prefix >= 430 && prefix <= 459) return "Columbus area";
  if (prefix >= 100 && prefix <= 119) return "New York City area";

  const region = ZIP_REGION_RANGES.find((r) => prefix >= r.min && prefix <= r.max);
  if (region) return region.label;

  return "your area";
}

export interface EstimatePayload {
  summary: {
    estimated_min_total: number;
    estimated_max_total: number;
    confidence_score: number;
    value_engineering_tips?: string[];
    regional_context?: string;
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
    source: "photo";
    justification?: string;
    priority?: "high" | "medium" | "low";
    phase?: string;
    maintenance_tips?: string;
  }>;
  explanations: string[];
}


export async function extractScopeWithGemini(input: {
  room_type: RoomType;
  zip_code: string;
  finish_preference: "economy" | "mid" | "premium";
  scopeDescription?: string | null;
  photoParts?: GeminiPart[];
}): Promise<EstimatePayload | null> {
  const { room_type, zip_code, finish_preference, scopeDescription, photoParts = [] } = input;
  const area = cityFromZip(zip_code);
  const dateStr = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long' });

  const systemInstruction = `You are a Senior Residential Construction Estimator with 20+ years of experience in the ${area}.
Your goal is to provide an ultra-detailed, high-value "Project Blueprint" that justifies its cost and helps the homeowner plan their budget.

Expert Guidelines:
1. Provide 8-15 specific line items. Group them mentally by construction phase (e.g., Site Prep, Rough-in, Finishes).
2. For each item, provide a "Justification" explaining why this cost is necessary (e.g., "Standard for high-moisture kitchen areas", "Requires specialized labor for large-format tiles").
3. Assign a "Priority" (high: essential for code/safety, medium: standard functionality, low: aesthetic upgrade).
4. Provide "Maintenance Tips" for long-term value (e.g., "Seal grout every 6 months to prevent staining").
5. In the summary, provide "Value Engineering Tips" on how to save 10-15% without sacrificing major quality.
6. Provide "Regional Context" regarding ${area} labor markets, permit expectations, or material availability in ${dateStr}.
7. Ensure all math is perfect: total_cost_min = quantity * unit_cost_min.
8. If photos are provided, identify specific brands, damage, or structural constraints visible.`;

  const prompt = `Project: ${room_type} Renovation
Location: ${zip_code} (${area})
Date: ${dateStr}
Target Finish Tier: ${finish_preference}
User Description: ${scopeDescription || "Analyze photos for full scope"}.

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
          regional_context: { type: "string" }
        },
        required: ["estimated_min_total", "estimated_max_total", "confidence_score"]
      },
      scope_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            description: { type: "string" },
            finish_tier: { type: "string", enum: ["economy", "mid", "premium"] },
            quantity: { type: "number" },
            unit: { type: "string" },
            unit_cost_min: { type: "number" },
            unit_cost_max: { type: "number" },
            total_cost_min: { type: "number" },
            total_cost_max: { type: "number" },
            confidence_score: { type: "number" },
            justification: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            phase: { type: "string" },
            maintenance_tips: { type: "string" }
          },
          required: [
            "category", "description", "finish_tier", "quantity", "unit", 
            "unit_cost_min", "unit_cost_max", "total_cost_min", "total_cost_max",
            "justification", "priority", "phase"
          ]
        }
      },
      explanations: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["summary", "scope_items", "explanations"]
  };

  const parts: GeminiPart[] = [{ text: prompt }, ...photoParts];

  try {
    const result = await callGemini({
      parts,
      systemInstruction,
      responseSchema,
      temperature: 0.1,
    });

    if (!result) return null;

    if (result.text.startsWith("ERROR:")) {
      console.error("Gemini API reported error:", result.text);
      return null;
    }

    let parsed: any;
    try {
      parsed = result.data || JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e, "Original text:", result.text);
      return null;
    }

    return {
      summary: {
        estimated_min_total: Math.round(Number(parsed.summary.estimated_min_total)),
        estimated_max_total: Math.round(Number(parsed.summary.estimated_max_total)),
        confidence_score: Number(parsed.summary.confidence_score),
        value_engineering_tips: parsed.summary.value_engineering_tips || [],
        regional_context: parsed.summary.regional_context || "",
      },
      scope_items: parsed.scope_items.map((s: any) => ({
        category: String(s.category),
        description: String(s.description),
        finish_tier: (s.finish_tier as any) || finish_preference,
        quantity: Number(s.quantity),
        unit: String(s.unit),
        unit_cost_min: Math.round(Number(s.unit_cost_min)),
        unit_cost_max: Math.round(Number(s.unit_cost_max)),
        total_cost_min: Math.round(Number(s.total_cost_min)),
        total_cost_max: Math.round(Number(s.total_cost_max)),
        confidence_score: Number(s.confidence_score || 3),
        source: "photo" as const,
        justification: s.justification,
        priority: s.priority,
        phase: s.phase,
        maintenance_tips: s.maintenance_tips,
      })),
      explanations: Array.isArray(parsed.explanations) ? parsed.explanations.map(String) : [],
    };
  } catch (e) {
    console.error("Gemini scope extraction failed:", e);
    return null;
  }
}
