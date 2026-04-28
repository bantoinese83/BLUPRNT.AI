import React, { useState, useMemo } from "react";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
} from "@shared/types/database";
import {
  AwarenessContext,
  type SmartInsight,
} from "@/contexts/AwarenessContext";
import { capitalImprovementTotal } from "@shared/lib/plan-vs-actual";
import { money } from "@shared/lib/formatters";

export function AwarenessProvider({
  children,
  project,
  scopeItems,
  ledgerEntries,
  spendByCategory,
  isArchitect,
  hasProjectPass,
  galleryItems,
}: {
  children: React.ReactNode;
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryRow[];
  spendByCategory: Record<string, number>;
  isArchitect: boolean;
  hasProjectPass: boolean;
  galleryItems: import("@shared/types/database").GalleryItemRow[];
}) {
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<
    "export" | "ledger_limit" | "general"
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

    // 1. Budget deviation — `spendByCategory` comes from ledger entry line items (see dashboard snapshot).
    const categoryTotals = spendByCategory;

    scopeItems.forEach((item) => {
      const actual = categoryTotals[item.category] || 0;
      if (item.total_cost_max && actual > item.total_cost_max) {
        newInsights.push({
          id: `budget-over-${item.id}`,
          type: "anomaly",
          title: `Budget Alert: ${item.category}`,
          description: `You've spent ${money(actual)} which exceeds the estimated max of ${money(item.total_cost_max)}.`,
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
    const capitalDocumentedTotal = capitalImprovementTotal(ledgerEntries);
    const scopeMaxSum = scopeItems.reduce(
      (s, it) => s + (it.total_cost_max ?? 0),
      0,
    );
    if (
      scopeItems.length > 0 &&
      scopeMaxSum > 0 &&
      capitalDocumentedTotal > scopeMaxSum &&
      lineBackedTotal < capitalDocumentedTotal * 0.85
    ) {
      newInsights.push({
        id: "budget-aggregate-over",
        type: "anomaly",
        title: "Spend above total scope",
        description: `Documented capital (ledger records) is about ${money(capitalDocumentedTotal)}, above the roughly ${money(scopeMaxSum)} ceiling in your line-item scope. Add line items to documents for category-level tracking.`,
      });
      health = health === "optimal" ? "warning" : health;
    }

    // 2. Project Stage Awareness
    if (project.stage === "planning" && scopeItems.length === 0) {
      newInsights.push({
        id: "missing-scope",
        type: "tip",
        title: "Define your scope",
        description:
          "Your project is in the planning stage. Adding scope items will help you track costs more accurately.",
        actionLabel: "Review Scope",
        actionKind: "scope",
      });
    }

    const stage = project.stage ?? "";
    if (
      (stage === "in_progress" ||
        stage === "collecting_quotes" ||
        stage === "construction") &&
      ledgerEntries.length === 0
    ) {
      newInsights.push({
        id: "no-invoices",
        type: "tip",
        title: "Track your spending",
        description:
          "You’re past the planning stage but haven’t uploaded ledger records yet. Add documents to stay on budget and sharpen these insights.",
        actionLabel: "Upload Document",
        actionKind: "execute",
      });
    }

    // 3. Opportunity: resale value tip (capital work, not maintenance-only log)
    if (capitalDocumentedTotal > 5000 && scopeItems.length > 0) {
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

    // 4. Next Best Action
    const nextAction =
      newInsights.length > 0
        ? newInsights[0]!.actionLabel || "Review Insights"
        : null;

    return {
      insights: newInsights,
      projectHealth: health,
      nextBestAction: nextAction,
    };
  }, [project, scopeItems, ledgerEntries, spendByCategory]);

  const value = useMemo(
    () => ({
      ...awarenessData,
      isInsightsOpen,
      setIsInsightsOpen,
      showUpgrade,
      setShowUpgrade,
      upgradeReason,
      setUpgradeReason,
      activeProjectId: project?.id ?? null,
      isArchitect,
      hasProjectPass,
      galleryItems,
    }),
    [
      awarenessData,
      isInsightsOpen,
      showUpgrade,
      upgradeReason,
      project?.id,
      isArchitect,
      hasProjectPass,
      galleryItems,
    ],
  );

  return (
    <AwarenessContext.Provider value={value}>
      {children}
    </AwarenessContext.Provider>
  );
}
