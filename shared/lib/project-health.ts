import { VIZ_GRADIENT } from "../constants/visualization.ts";

export type ProjectHealthStatus =
  | "Analyzing"
  | "Over Budget"
  | "At Limit"
  | "Excellent"
  | "Healthy";

export interface HealthScoreResult {
  score: number;
  status: ProjectHealthStatus;
  message: string;
  // Visual metadata (colors are platform-specific, but stops/tokens can be shared)
  stop1: string;
  stop2: string;
}

/**
 * Shared logic for project health scoring based on spending vs estimate.
 */
export function calculateHealthScore(
  spendingTotal: number,
  estimatedMin: number,
  estimatedMax: number,
): HealthScoreResult {
  // Normalize bounds and handle negative spend
  const actualSpend = Math.max(0, spendingTotal);
  const [min, max] =
    estimatedMin <= estimatedMax
      ? [estimatedMin, estimatedMax]
      : [estimatedMax, estimatedMin];

  if (min === 0 || actualSpend === 0) {
    const g = VIZ_GRADIENT.healthAnalyzing;
    return {
      score: 0,
      status: "Analyzing",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "Processing your initial project data...",
    };
  }

  const progressPct = (actualSpend / min) * 100;
  const budgetUtilization = (actualSpend / max) * 100;

  if (budgetUtilization > 100) {
    const overPct = budgetUtilization - 100;
    const g = VIZ_GRADIENT.healthOver;
    return {
      score: Math.max(0, Math.round(70 - overPct)),
      status: "Over Budget",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "Careful! You've exceeded your lifecycle estimate.",
    };
  }

  if (budgetUtilization > 85) {
    const g = VIZ_GRADIENT.healthAtLimit;
    return {
      score: 75,
      status: "At Limit",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "You're approaching the upper limit of your budget.",
    };
  }

  if (progressPct < 20) {
    const g = VIZ_GRADIENT.healthExcellent;
    return {
      score: 95,
      status: "Excellent",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "Starting strong! Your initial spending is well-aligned.",
    };
  }

  const g = VIZ_GRADIENT.healthHealthy;
  return {
    score: 88,
    status: "Healthy",
    stop1: g.stop1,
    stop2: g.stop2,
    message: "Your project spending is pacing well against estimates.",
  };
}
