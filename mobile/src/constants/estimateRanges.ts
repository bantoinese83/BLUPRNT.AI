/**
 * Honest, type-based estimate ranges shown during mobile onboarding
 * BEFORE the real AI photo analysis occurs post-signup.
 *
 * These are broad industry ranges — not AI estimates. The UI must
 * communicate this clearly to avoid a bait-and-switch perception.
 */
const ESTIMATE_RANGES: Record<
  string,
  { min: number; max: number; label: string }
> = {
  Kitchen: { min: 12000, max: 45000, label: "$12k – $45k" },
  Bathroom: { min: 6000, max: 25000, label: "$6k – $25k" },
  Painting: { min: 1500, max: 8000, label: "$1.5k – $8k" },
  Roof: { min: 8000, max: 30000, label: "$8k – $30k" },
  Flooring: { min: 3000, max: 15000, label: "$3k – $15k" },
  "Something else": { min: 5000, max: 50000, label: "$5k – $50k" },
};

const DEFAULT_RANGE = { min: 5000, max: 50000, label: "$5k – $50k" };

export function getRangeForType(projectType: string | null): {
  min: number;
  max: number;
  label: string;
} {
  if (!projectType) return DEFAULT_RANGE;
  return ESTIMATE_RANGES[projectType] ?? DEFAULT_RANGE;
}
