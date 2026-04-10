import React, { useState, useMemo } from "react";
import type { ProjectRow, ScopeRow, InvoiceRow } from "@shared/types/database";
import { AwarenessContext, SmartInsight } from "./AwarenessContext";

export function AwarenessProvider({
  children,
  project,
  scopeItems,
  invoices,
  spendByCategory,
}: {
  children: React.ReactNode;
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  spendByCategory: Record<string, number>;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const awarenessData = useMemo(() => {
    if (!project)
      return {
        insights: [] as SmartInsight[],
        projectHealth: "optimal" as const,
        nextBestAction: null as string | null,
      };

    const newInsights: SmartInsight[] = [];
    let health: "optimal" | "warning" | "critical" = "optimal";

    const categoryTotals = spendByCategory;

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

    const lineBackedTotal = Object.values(categoryTotals).reduce(
      (a, b) => a + b,
      0,
    );
    const invoiceGrandTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const scopeMaxSum = scopeItems.reduce(
      (s, it) => s + (it.total_cost_max ?? 0),
      0,
    );
    if (
      scopeItems.length > 0 &&
      scopeMaxSum > 0 &&
      invoiceGrandTotal > scopeMaxSum &&
      lineBackedTotal < invoiceGrandTotal * 0.85
    ) {
      newInsights.push({
        id: "budget-aggregate-over",
        type: "anomaly",
        title: "Spend above total scope",
        description: `Invoices total about $${invoiceGrandTotal.toLocaleString()}, above the roughly $${scopeMaxSum.toLocaleString()} ceiling in your line-item scope. Add line items to invoices for category-level tracking.`,
      });
      health = health === "optimal" ? "warning" : health;
    }

    if (project.stage === "planning" && scopeItems.length === 0) {
      newInsights.push({
        id: "missing-scope",
        type: "tip",
        title: "Define your scope",
        description:
          "Your project is in the planning stage. Adding scope items will help you track costs more accurately.",
        actionLabel: "Add Items",
        actionKind: "scope",
      });
    }

    const stage = project.stage ?? "";
    if (
      (stage === "in_progress" ||
        stage === "collecting_quotes" ||
        stage === "construction") &&
      invoices.length === 0
    ) {
      newInsights.push({
        id: "no-invoices",
        type: "tip",
        title: "Track your spending",
        description:
          "You’re past the planning stage but haven’t uploaded invoices yet. Add documents to stay on budget and sharpen these insights.",
        actionLabel: "Upload Invoice",
        actionKind: "execute",
      });
    }

    const invoiceTotal = invoices.reduce((s, i) => s + (i.total || 0), 0);
    if (invoiceTotal > 5000 && scopeItems.length > 0) {
      newInsights.push({
        id: "resale-opportunity",
        type: "opportunity",
        title: "Seller Packet Ready",
        description:
          "Your investment is substantial enough to generate a compelling Seller Packet. Export it to maximize your property value.",
        actionLabel: "Export Packet",
        actionKind: "record",
      });
    }

    const nextAction =
      newInsights.length > 0
        ? newInsights[0].actionLabel || "Review Insights"
        : null;

    return {
      insights: newInsights,
      projectHealth: health,
      nextBestAction: nextAction,
    };
  }, [project, scopeItems, invoices, spendByCategory]);

  return (
    <AwarenessContext.Provider
      value={{
        ...awarenessData,
        isSidebarOpen,
        setIsSidebarOpen,
        activeProjectId: project?.id ?? null,
      }}
    >
      {children}
    </AwarenessContext.Provider>
  );
}
