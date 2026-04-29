import type { BillOfMaterialItem } from "./onboarding.ts";

export interface ScopeMetadata {
  justification?: string;
  priority?: "high" | "medium" | "low";
  phase?: string;
  care_tips?: string;
  maintenance_tips?: string;
  confidence_reason?: string;
  materials?: BillOfMaterialItem[];
}

export interface ProjectMetadata {
  justification?: string;
  budget_breakdown?: Record<string, number>;
  [key: string]: unknown;
}
