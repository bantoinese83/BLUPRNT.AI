import React, { createContext, useContext, useState, useMemo } from "react";
import type { ProjectRow, ScopeRow, InvoiceRow } from "../types/database";

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
  isInsightsOpen: boolean;
  setIsInsightsOpen: (isOpen: boolean) => void;
  showUpgrade: boolean;
  setShowUpgrade: (show: boolean) => void;
  upgradeReason: "export" | "invoice_limit" | "general";
  setUpgradeReason: (reason: "export" | "invoice_limit" | "general") => void;
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
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<
    "export" | "invoice_limit" | "general"
  >("general");

  const awarenessData = useMemo(() => {
    if (!project) {
      return {
        insights: [],
        projectHealth: "optimal" as const,
        nextBestAction: null,
      };
    }

    const newInsights: SmartInsight[] = [];
    let health: "optimal" | "warning" | "critical" = "optimal";

    // 1. Budget Deviation Analysis
    const categoryTotals: Record<string, number> = {};
    invoices.forEach((inv) => {
      const cat = (inv as any).category || "Uncategorized";
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
        actionLabel: "Review Scope",
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

    // 3. Opportunity: resale value tip
    const invoiceTotal = invoices.reduce((s, i) => s + (i.total || 0), 0);
    if (invoiceTotal > 5000 && scopeItems.length > 0) {
      newInsights.push({
        id: "resale-opportunity",
        type: "opportunity",
        title: "Seller Packet Ready",
        description:
          "Your investment is substantial enough to generate a compelling Seller Packet. Export it to maximize your property value.",
        actionLabel: "Export Packet",
      });
    }

    // 4. Next Best Action
    const nextAction =
      newInsights.length > 0
        ? newInsights[0].actionLabel || "Review Insights"
        : null;

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
        isInsightsOpen,
        setIsInsightsOpen,
        showUpgrade,
        setShowUpgrade,
        upgradeReason,
        setUpgradeReason,
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
