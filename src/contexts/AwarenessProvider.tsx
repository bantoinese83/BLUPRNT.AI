import React, { createContext, useContext, useState, useMemo } from "react";
import type { ProjectRow, ScopeRow, InvoiceRow } from "@/types/database";

export interface SmartInsight {
  id: string;
  type: "anomaly" | "tip" | "opportunity";
  title: string;
  description: string;
  actionLabel?: string;
  category?: string;
}

interface AwarenessState {
  insights: SmartInsight[];
  projectHealth: "optimal" | "warning" | "critical";
  nextBestAction: string | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const AwarenessContext = createContext<AwarenessState | undefined>(undefined);

export function AwarenessProvider({
  children,
  project,
  scopeItems,
  invoices,
}: {
  children: React.ReactNode;
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const awarenessData = useMemo(() => {
    if (!project)
      return {
        insights: [],
        projectHealth: "optimal" as const,
        nextBestAction: null,
      };

    const newInsights: SmartInsight[] = [];
    let health: "optimal" | "warning" | "critical" = "optimal";

    // 1. Budget Deviation Analysis
    const categoryTotals: Record<string, number> = {};
    invoices.forEach((inv) => {
      // @ts-expect-error: category added via migration
      const cat = inv.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (inv.total || 0);
    });

    scopeItems.forEach((item) => {
      const actual = categoryTotals[item.category] || 0;
      if (item.total_cost_max && actual > item.total_cost_max) {
        newInsights.push({
          id: `budget-over-${item.id}`,
          type: "anomaly",
          title: `Budget Alert: ${item.category}`,
          description: `You've spent $${actual.toLocaleString()} which exceeds the estimated max of $${item.total_cost_max.toLocaleString()}.`,
          category: item.category,
        });
        health = "critical";
      } else if (item.total_cost_max && actual > item.total_cost_max * 0.8) {
        health = health === "critical" ? "critical" : "warning";
      }
    });

    // 2. Project Stage Awareness
    if (project.stage === "planning" && scopeItems.length === 0) {
      newInsights.push({
        id: "missing-scope",
        type: "tip",
        title: "Define your scope",
        description:
          "Your project is in the planning stage. Adding scope items will help you track costs more accurately.",
        actionLabel: "Add Items",
      });
    }

    if (project.stage === "construction" && invoices.length === 0) {
      newInsights.push({
        id: "no-invoices",
        type: "tip",
        title: "Track your spending",
        description:
          "You're in the construction phase but haven't uploaded any invoices yet. Start tracking to stay on budget.",
        actionLabel: "Upload Invoice",
      });
    }

    // 3. Next Best Action
    let nextAction = null;
    if (newInsights.length > 0) {
      nextAction = newInsights[0].actionLabel || "Review Insights";
    }

    return {
      insights: newInsights,
      projectHealth: health,
      nextBestAction: nextAction,
    };
  }, [project, scopeItems, invoices]);

  return (
    <AwarenessContext.Provider
      value={{
        ...awarenessData,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >
      {children}
    </AwarenessContext.Provider>
  );
}

export function useAwareness() {
  const context = useContext(AwarenessContext);
  if (context === undefined) {
    throw new Error("useAwareness must be used within an AwarenessProvider");
  }
  return context;
}
