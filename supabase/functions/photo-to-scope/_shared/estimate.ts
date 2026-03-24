import { callGemini, type GeminiPart } from "../../_shared/gemini.ts";

export type RoomType = "kitchen" | "bathroom" | "other";

export function cityFromZip(zip: string): string {
  const z = zip.replace(/\D/g, "").slice(0, 5);
  if (z.length >= 3) {
    const n = parseInt(z.slice(0, 3), 10);
    if (n >= 100 && n <= 199) return "your area";
    if (n >= 900 && n <= 961) return "Los Angeles area";
    if (n >= 430 && n <= 459) return "Columbus area";
  }
  return "your area";
}

export interface EstimatePayload {
  summary: {
    estimated_min_total: number;
    estimated_max_total: number;
    confidence_score: number;
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

  const systemInstruction = `You are an expert residential construction estimator. 
Analyze the project details and photos to generate a detailed, line-by-line cost estimate.
Guidelines:
1. Provide 6-12 detailed line items.
2. If photos are provided, explicitly mention visible features.
3. Ensure totals match (quantity * unit_cost).
4. Summary total must be the sum of all line items.`;

  const prompt = `Project: ${room_type} in ${zip_code} (adjust for region).
Finish: ${finish_preference}.
Description: ${scopeDescription || "Analyze photos"}.`;

  const responseSchema = {
    type: "object",
    properties: {
      summary: {
        type: "object",
        properties: {
          estimated_min_total: { type: "number" },
          estimated_max_total: { type: "number" },
          confidence_score: { type: "number", description: "1 to 5" }
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
            confidence_score: { type: "number" }
          },
          required: ["category", "description", "finish_tier", "quantity", "unit", "unit_cost_min", "unit_cost_max", "total_cost_min", "total_cost_max"]
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
    const text = await callGemini({
      parts,
      systemInstruction,
      responseSchema,
      temperature: 0.1,
    });

    if (!text) return null;

    if (text.startsWith("ERROR:")) {
      console.error("Gemini API reported error:", text);
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e, "Original text:", text);
      return null;
    }

    return {
      summary: {
        estimated_min_total: Math.round(Number(parsed.summary.estimated_min_total)),
        estimated_max_total: Math.round(Number(parsed.summary.estimated_max_total)),
        confidence_score: Number(parsed.summary.confidence_score),
      },
      scope_items: parsed.scope_items.map((s: any) => ({
        category: String(s.category),
        description: String(s.description),
        finish_tier: finish_preference,
        quantity: Number(s.quantity),
        unit: String(s.unit),
        unit_cost_min: Math.round(Number(s.unit_cost_min)),
        unit_cost_max: Math.round(Number(s.unit_cost_max)),
        total_cost_min: Math.round(Number(s.total_cost_min)),
        total_cost_max: Math.round(Number(s.total_cost_max)),
        confidence_score: Number(s.confidence_score || 3),
        source: "photo" as const,
      })),
      explanations: Array.isArray(parsed.explanations) ? parsed.explanations.map(String) : [],
    };
  } catch (e) {
    console.error("Gemini scope extraction failed:", e);
    return null;
  }
}
