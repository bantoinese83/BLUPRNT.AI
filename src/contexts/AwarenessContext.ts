import { createContext, useContext } from "react";

export interface SmartInsight {
  id: string;
  type: "anomaly" | "tip" | "opportunity";
  title: string;
  description: string;
  actionLabel?: string;
  category?: string;
}

export interface AwarenessState {
  insights: SmartInsight[];
  projectHealth: "optimal" | "warning" | "critical";
  nextBestAction: string | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
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
