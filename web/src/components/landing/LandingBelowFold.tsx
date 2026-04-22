import { LandingTrustStrip } from "@/components/landing/LandingTrustStrip";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingStory } from "@/components/landing/LandingStory";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { PLAN_COMPARISON_ROWS } from "@/components/landing/landing-content";
import { LANDING_FAQ } from "@/lib/site-url";

export type LandingBelowFoldProps = {
  isArchitect: boolean;
  onPlanSelect: (plan: "architect" | "pass") => void | Promise<void>;
};

/**
 * Below-the-fold marketing sections — lazy-loaded from `Landing` so the hero
 * paints with less JS and fewer secondary image requests on first navigation.
 */
export function LandingBelowFold({
  isArchitect,
  onPlanSelect,
}: LandingBelowFoldProps) {
  return (
    <>
      <LandingTrustStrip />
      <LandingSocialProof />
      <LandingHowItWorks />
      <LandingComparison />
      <LandingStory />
      <LandingFeatures />
      <LandingPricing
        isArchitect={isArchitect}
        onPlanSelect={onPlanSelect}
        planComparisonRows={PLAN_COMPARISON_ROWS}
      />
      <LandingFaq faqData={LANDING_FAQ} />
      <LandingFinalCta />
    </>
  );
}
