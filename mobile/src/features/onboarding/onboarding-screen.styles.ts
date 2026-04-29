import { commonStyles } from "./styles/common.styles";
import { selectorStyles } from "./styles/selectors.styles";
import { visionStyles } from "./styles/vision.styles";
import { analysisStyles } from "./styles/analysis.styles";
import { estimateStyles } from "./styles/estimate.styles";
import { finalStyles } from "./styles/final.styles";

/**
 * Aggregated onboarding styles.
 * Refactored from a monolithic 1000-line file into modular sub-modules.
 */
export const onboardingStyles = {
  ...commonStyles,
  ...selectorStyles,
  ...visionStyles,
  ...analysisStyles,
  ...estimateStyles,
  ...finalStyles,
};

export type OnboardingStyles = typeof onboardingStyles;
