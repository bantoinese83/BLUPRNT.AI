import { createContext, useContext } from "react";

/** When set with `actionLabel`, the insights UI navigates on tap (see SmartSidebar / InsightsDrawer). */
export type SmartInsightActionKind = "scope" | "execute" | "record";

export interface SmartInsight {
  id: string;
  type: "anomaly" | "tip" | "opportunity";
  title: string;
  description: string;
  actionLabel?: string;
  /** Route / behavior for the CTA — omit if the row is informational only */
  actionKind?: SmartInsightActionKind;
  category?: string;
}

export interface AwarenessState {
  insights: SmartInsight[];
  projectHealth: "optimal" | "warning" | "critical";
  nextBestAction: string | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (isOpen: boolean) => void;
  activeProjectId: string | null;
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
