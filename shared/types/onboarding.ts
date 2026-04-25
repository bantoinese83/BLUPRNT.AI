/**
 * Shared onboarding types for Web and Mobile.
 * Centralizing these ensures data consistency during project initialization.
 */

export interface OnboardingScopeItem {
  category: string;
  description: string;
  finish_tier?: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost_min: number | null;
  unit_cost_max: number | null;
  total_cost_min: number | null;
  total_cost_max: number | null;
  confidence_score: number | null;
  source?: "text" | "photo" | "fallback" | string;
  justification?: string | null;
  priority?: string | null;
  phase?: string | null;
  maintenance_tips?: string | null;
  confidence_reason?: string | null;
  verification_required?: boolean | null;
  /** Present on raw photo-to-scope payloads; merged into `metadata.materials` in API responses. */
  materials?: Array<{
    name: string;
    brand?: string;
    quantity?: number | string;
    unit?: string;
    estimated_cost?: number;
  }>;
  metadata?: {
    materials?: Array<{
      name: string;
      brand?: string;
      quantity?: number | string;
      unit?: string;
    }>;
    justification?: string;
    priority?: string;
    phase?: string;
    maintenance_tips?: string;
    confidence_reason?: string;
    estimated_cost?: number;
  };
}

export interface OnboardingPhotoToScopeResult {
  summary: {
    estimated_min_total: number;
    estimated_max_total: number;
    confidence_score: number;
    grounding_sources?: Array<{ title: string; url?: string }>;
    regional_context?: string;
    regional_signal?: string;
    value_engineering_tips?: string[];
  };
  scope_items: OnboardingScopeItem[];
  /** True when the Edge function used `getFallbackEstimate` (Gemini returned no payload). */
  used_fallback?: boolean;
  /** Machine-readable cause; see `@shared/constants/onboarding` helpers. */
  fallback_reason?: string | null;
}
