/** Region-grounded mock scope; swap for Gemini when GEMINI_API_KEY is set. */

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

export function buildScopePayload(input: {
  room_type: RoomType;
  zip_code: string;
  finish_preference: "economy" | "mid" | "premium";
  photoCount: number;
  locationUnset?: boolean;
  scopeDescription?: string | null;
}): {
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
} {
  const tier = input.finish_preference;
  const mult = tier === "economy" ? 0.85 : tier === "premium" ? 1.2 : 1;
  const zip = input.zip_code.replace(/\D/g, "").slice(0, 5) || "00000";
  const photoBoost = input.photoCount > 0 ? 1 : input.scopeDescription ? 0.9 : 0.92;
  const locationPenalty = input.locationUnset ? 0.85 : 1;

  if (input.room_type === "kitchen") {
    const items = [
      {
        category: "Cabinets",
        description:
          "Replace base and wall cabinets with mid-range shaker style",
        finish_tier: tier,
        quantity: 18,
        unit: "linear_ft",
        unit_cost_min: Math.round(250 * mult),
        unit_cost_max: Math.round(350 * mult),
        total_cost_min: Math.round(4500 * mult * photoBoost * locationPenalty),
        total_cost_max: Math.round(6300 * mult * photoBoost * locationPenalty),
        confidence_score: 4.7,
        source: "photo" as const,
      },
      {
        category: "Countertops",
        description: "Install new quartz countertops",
        finish_tier: tier,
        quantity: 45,
        unit: "sqft",
        unit_cost_min: Math.round(70 * mult),
        unit_cost_max: Math.round(95 * mult),
        total_cost_min: Math.round(3150 * mult * photoBoost),
        total_cost_max: Math.round(4275 * mult * photoBoost),
        confidence_score: 4.3,
        source: "photo" as const,
      },
      {
        category: "Flooring",
        description: "New LVP or tile throughout work area",
        finish_tier: tier,
        quantity: 180,
        unit: "sqft",
        unit_cost_min: 4,
        unit_cost_max: 9,
        total_cost_min: 720,
        total_cost_max: 1620,
        confidence_score: 4.0,
        source: "photo" as const,
      },
      {
        category: "Electrical & plumbing",
        description: "Adjustments for layout and fixtures",
        finish_tier: tier,
        quantity: 1,
        unit: "job",
        unit_cost_min: 3500,
        unit_cost_max: 5200,
        confidence_score: 3.9,
        source: "photo" as const,
      },
    ];
    const minSum = items.reduce((s, i) => s + i.total_cost_min, 0);
    const maxSum = items.reduce((s, i) => s + i.total_cost_max, 0);
    return {
      summary: {
        estimated_min_total: Math.round(minSum * 0.95 * locationPenalty),
        estimated_max_total: Math.round(maxSum * 1.05 * locationPenalty),
        confidence_score: input.locationUnset ? 3.5 : 4.5,
      },
      scope_items: items,
      explanations: [
        `Cabinet costs based on ${tier}-range finishes${input.locationUnset ? " (location unknown — add ZIP for better accuracy)" : ` near ${zip}`}.`,
        input.photoCount > 0
          ? "Scope sized using your photos and typical kitchen footprints."
          : "Scope uses typical kitchen footprints; add photos anytime to tighten accuracy.",
      ],
    };
  }

  if (input.room_type === "bathroom") {
    const items = [
      {
        category: "Vanity & fixtures",
        description: "Replace vanity, faucet, and toilet",
        finish_tier: tier,
        quantity: 1,
        unit: "room",
        unit_cost_min: 2200,
        unit_cost_max: 4800,
        total_cost_min: 2200,
        total_cost_max: 4800,
        confidence_score: 4.4,
        source: "photo" as const,
      },
      {
        category: "Tile & shower",
        description: "Shower surround and floor tile",
        finish_tier: tier,
        quantity: 120,
        unit: "sqft",
        unit_cost_min: 12,
        unit_cost_max: 28,
        total_cost_min: 1440,
        total_cost_max: 3360,
        confidence_score: 4.1,
        source: "photo" as const,
      },
      {
        category: "Plumbing rough-in",
        description: "Rough-in updates for layout",
        finish_tier: tier,
        quantity: 1,
        unit: "job",
        unit_cost_min: 1800,
        unit_cost_max: 3200,
        confidence_score: 3.8,
        source: "photo" as const,
      },
    ];
    const minSum = items.reduce((s, i) => s + i.total_cost_min, 0);
    const maxSum = items.reduce((s, i) => s + i.total_cost_max, 0);
    return {
      summary: {
        estimated_min_total: Math.round(minSum * 0.95),
        estimated_max_total: Math.round(maxSum * 1.05),
        confidence_score: 4.3,
      },
      scope_items: items,
      explanations: [
        `Bath remodel costs for ${tier}-range finishes in your ZIP area.`,
        input.photoCount > 0
          ? "Tub/shower footprint informed by your photos."
          : "Typical full bath footprint assumed until you add photos.",
      ],
    };
  }

  const items = [
    {
      category: "Labor & materials",
      description: "General remodel scope for this project type",
      finish_tier: tier,
      quantity: 1,
      unit: "job",
      unit_cost_min: 8000,
      unit_cost_max: 22000,
      total_cost_min: 8000,
      total_cost_max: 22000,
      confidence_score: 3.5,
      source: "photo" as const,
    },
  ];
  return {
    summary: {
      estimated_min_total: 7500,
      estimated_max_total: 24000,
      confidence_score: 3.8,
    },
    scope_items: items,
    explanations: [
      `Broad estimate for your area (${zip}). Pick kitchen or bath for a tighter range.`,
    ],
  };
}
