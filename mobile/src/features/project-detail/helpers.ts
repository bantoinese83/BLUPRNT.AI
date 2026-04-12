import type { ProjectRow, ScopeRow } from "@shared/types/database";

export function projectHasEstimateTotals(p: ProjectRow | null): boolean {
  if (!p) return false;
  const min = p.estimated_min_total;
  const max = p.estimated_max_total;
  return (
    (typeof min === "number" && Number.isFinite(min) && min > 0) ||
    (typeof max === "number" && Number.isFinite(max) && max > 0)
  );
}

export function groupScopeByCategory(
  scope: ScopeRow[],
): Record<string, ScopeRow[]> {
  return scope.reduce(
    (acc, item) => {
      const cat = item.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, ScopeRow[]>,
  );
}
