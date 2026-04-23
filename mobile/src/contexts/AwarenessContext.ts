import { createContext, useContext } from "react";

export type SmartInsightActionKind = "scope" | "execute" | "record";

export interface SmartInsight {
  id: string;
  type: "anomaly" | "tip" | "opportunity";
  title: string;
  description: string;
  actionLabel?: string;
  actionKind?: SmartInsightActionKind;
  category?: string;
}

export interface AwarenessState {
  insights: SmartInsight[];
  projectHealth: "optimal" | "warning" | "critical";
  nextBestAction: string | null;
  isInsightsOpen: boolean;
  setIsInsightsOpen: (isOpen: boolean) => void;
  showUpgrade: boolean;
  setShowUpgrade: (show: boolean) => void;
  upgradeReason: "export" | "invoice_limit" | "general";
  setUpgradeReason: (reason: "export" | "invoice_limit" | "general") => void;
  activeProjectId: string | null;
  /** Mirrors dashboard snapshot — paywall should respect subscription state. */
  isArchitect: boolean;
  hasProjectPass: boolean;
  galleryItems: import("@shared/types/database").GalleryItemRow[];
}

export const AwarenessContext = createContext<AwarenessState | undefined>(
  undefined,
);

export function useAwareness() {
  const context = useContext(AwarenessContext);
  if (context === undefined) {
    throw new Error("useAwareness must be used within an AwarenessProvider");
  }
  return context;
}
