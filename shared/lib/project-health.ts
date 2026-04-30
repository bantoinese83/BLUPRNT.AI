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
  /** Documented spend as % of estimate low (0 when min is unusable). */
  pctOfEstimateLow: number;
  /** Documented spend as % of estimate high (0 when max is unusable). */
  pctOfEstimateHigh: number;
  /** Dollars above the high estimate (0 when at or under). */
  dollarsOverHighEstimate: number;
}

/**
 * Thresholds and scores for project health calculations.
 */
export const HEALTH_THRESHOLDS = {
  /** Upper budget limit (85%) */
  AT_LIMIT_UTILIZATION: 85,
  /** Initial progress threshold (20%) */
  EXCELLENT_PROGRESS: 20,
  /** Base score for over-budget projects */
  BASE_OVER_BUDGET_SCORE: 70,
  /** Score for projects at limit */
  SCORE_AT_LIMIT: 75,
  /** Score for projects with excellent progress */
  SCORE_EXCELLENT: 95,
  /** Default score for healthy projects */
  SCORE_HEALTHY: 88,
} as const;

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

  const pctOfEstimateLow = min > 0 ? (actualSpend / min) * 100 : 0;
  const pctOfEstimateHigh = max > 0 ? (actualSpend / max) * 100 : 0;
  const dollarsOverHighEstimate = Math.max(0, actualSpend - max);
  const metrics = {
    pctOfEstimateLow,
    pctOfEstimateHigh,
    dollarsOverHighEstimate,
  };

  if (min === 0 || actualSpend === 0) {
    const g = VIZ_GRADIENT.healthAnalyzing;
    return {
      score: 0,
      status: "Analyzing",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "Processing your initial project data...",
      ...metrics,
    };
  }

  const progressPct = (actualSpend / min) * 100;
  const budgetUtilization = (actualSpend / max) * 100;

  if (budgetUtilization > 100) {
    const overPct = budgetUtilization - 100;
    const g = VIZ_GRADIENT.healthOver;
    return {
      score: Math.max(
        0,
        Math.round(HEALTH_THRESHOLDS.BASE_OVER_BUDGET_SCORE - overPct),
      ),
      status: "Over Budget",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "Careful! You've exceeded your lifecycle estimate.",
      ...metrics,
    };
  }

  if (budgetUtilization > HEALTH_THRESHOLDS.AT_LIMIT_UTILIZATION) {
    const g = VIZ_GRADIENT.healthAtLimit;
    return {
      score: HEALTH_THRESHOLDS.SCORE_AT_LIMIT,
      status: "At Limit",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "You're approaching the upper limit of your budget.",
      ...metrics,
    };
  }

  if (progressPct < HEALTH_THRESHOLDS.EXCELLENT_PROGRESS) {
    const g = VIZ_GRADIENT.healthExcellent;
    return {
      score: HEALTH_THRESHOLDS.SCORE_EXCELLENT,
      status: "Excellent",
      stop1: g.stop1,
      stop2: g.stop2,
      message: "Starting strong! Your initial spending is well-aligned.",
      ...metrics,
    };
  }

  const g = VIZ_GRADIENT.healthHealthy;
  return {
    score: HEALTH_THRESHOLDS.SCORE_HEALTHY,
    status: "Healthy",
    stop1: g.stop1,
    stop2: g.stop2,
    message: "Your project spending is pacing well against estimates.",
    ...metrics,
  };
}
