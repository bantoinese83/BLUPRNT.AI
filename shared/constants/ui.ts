/**
 * UI-related constants and animation durations.
 */
export const LEDGER_UPLOAD_ANCHOR_ID = "document-upload-anchor" as const;

export const UI_CONSTANTS = {
  /** Duration to show the swipe hint on the Transformation Vault (mobile) */
  SWIPE_HINT_DURATION_MS: 2800,

  /** Default animation duration for page transitions */
  PAGE_TRANSITION_MS: 400,

  /** Standard polling interval for data refreshes (e.g. project status) */
  POLLING_INTERVAL_MS: 2500,
} as const;
