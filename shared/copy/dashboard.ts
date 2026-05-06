/**
 * Dashboard marketing / empty-state copy shared by web and mobile.
 * Keep user-facing strings here so section titles and zero-project states stay aligned.
 */
export const DASHBOARD_SECTION_PLAN_SPENDING = "Plan & spending";

export const DASHBOARD_SECTION_GUIDED_PATH = "Your guided path";

export const DASHBOARD_EMPTY_STATE = {
  title: "Your estimate and ledger in one story",
  description:
    "Start a project for a local cost range, then add quotes and documents so plan vs. actual stays clear—whether you’re mid-remodel or getting ready to list.",
  primaryCta: "Start your project",
  secondaryCta: "Walk through the intro first",
} as const;

export const DASHBOARD_STATS_LABELS = {
  estimate: "Estimate",
  estimateSub: "Total project range",
  documents: "Documents",
  documentsSub: "Files in your ledger",
  invested: "Invested",
  investedSub: "Logged capital spend",
  projectedInvestment: "Projected Investment",
  invoicesAndQuotes: "Ledger records",
} as const;

export const RECONCILIATION_STATUS_LABELS = {
  reconciled: "Matched",
  over: "Over",
  under: "Under",
} as const;

export const CONFIDENCE_LABELS = {
  marketPrecision: "Market Precision",
  confidence: "Confidence",
} as const;

/** Transformation vault (before/after photos) — keep web + mobile headers aligned. */
export const TRANSFORMATION_VAULT_COPY = {
  title: "Transformation vault",
  /** Short label for the before/after concept (used as subtitle on mobile). */
  strap: "Before & after",
  uploadSuccess: "Photo uploaded.",
  uploadFailed: "Could not upload photo. Try again.",
  signedUrlError:
    "Photos could not be loaded. Try Retry or refresh this screen.",
  retry: "Retry",
} as const;

export const UPCOMING_RENEWALS_COPY = {
  title: "Renewals & expirations",
  subtitle: "Warranties, insurance, and permits we’re tracking.",
} as const;
