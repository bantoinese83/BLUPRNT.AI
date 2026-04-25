import type { BillOfMaterialItem } from "./onboarding";

export interface ScopeMetadata {
  justification?: string;
  priority?: "high" | "medium" | "low";
  phase?: string;
  maintenance_tips?: string;
  confidence_reason?: string;
  materials?: BillOfMaterialItem[];
}

export interface ProjectMetadata {
  justification?: string;
  budget_breakdown?: Record<string, number>;
  [key: string]: unknown;
}
