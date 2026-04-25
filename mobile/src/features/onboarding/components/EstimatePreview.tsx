import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import * as Haptics from "expo-haptics";
import { ChevronDown, ChevronUp, Check, TrendingUp } from "lucide-react-native";
import { money } from "@shared/lib/formatters";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProjectIcon } from "@/lib/project-icons";
import { Theme } from "@/constants/Theme";
import { ScopeEstimateBreakdown } from "@/features/onboarding/components/ScopeEstimateBreakdown";
import { BillOfMaterialsList } from "@/features/onboarding/components/BillOfMaterialsList";

import {
  estimateFallbackUserMessage,
  hasValidOnboardingZip,
} from "@shared/constants/onboarding";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";
import type { OnboardingEstimateState } from "@/features/onboarding/hooks/useOnboardingAnalysis";

interface EstimatePreviewProps {
  styles: OnboardingStyles;
  projectType: string | null;
  location: string;
  estimate: OnboardingEstimateState;
  showBreakdown: boolean;
  setShowBreakdown: (show: boolean) => void;
}

export function EstimatePreview({
  styles,
  projectType,
  location,
  estimate,
  showBreakdown,
  setShowBreakdown,
}: EstimatePreviewProps) {
  const fallbackLine = estimateFallbackUserMessage(
    estimate?.usedFallback,
    estimate?.fallbackReason,
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -20 }}
      key="step5"
      style={styles.step5Column}
    >
      <Text style={styles.stepTitle}>Your BLUPRNT is ready</Text>
      <Text style={styles.stepSubtitle}>
        Based on market data for{" "}
        {hasValidOnboardingZip(location) ? location.trim() : "your area"}.
      </Text>

      <GlassCard intensity={30} style={styles.estimateCard}>
        <View style={styles.estimateHeader}>
          <View style={styles.estimateIconCircle}>
            <ProjectIcon name={projectType || ""} size={36} />
          </View>
          <View style={styles.confidenceBadge}>
            <TrendingUp size={12} color={Theme.colors.brand.deep} />
            <Text style={styles.confidenceText}>Refined Range</Text>
          </View>
        </View>

        <Text style={styles.estimateLabel}>Investment Range</Text>
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 10,
            delay: 500,
          }}
          onDidAnimate={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        >
          <Text style={styles.estimateValue}>
            {money(estimate?.min ?? 0, estimate?.max ?? 0)}
          </Text>
        </MotiView>

        {fallbackLine ? (
          <Text style={styles.estimateFallbackNotice}>{fallbackLine}</Text>
        ) : null}

        <Text style={styles.estimateDisclaimer}>
          {estimate?.scope && estimate.scope.length > 0
            ? "From your photos and notes—not a contractor bid. The line-by-line list below is what we used for the total."
            : "From your project type and zip for now. Add photos on the Vision step next time for a richer breakdown."}
        </Text>

        <View style={styles.estimateDivider} />

        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Check size={14} color="#2dd4bf" />
            <Text style={styles.breakdownText}>Typical labor near you</Text>
          </View>
          {estimate?.scope && estimate.scope.length > 0 ? (
            <>
              <TouchableOpacity
                style={[
                  styles.viewDetailsBtn,
                  showBreakdown && styles.activeViewDetailsBtn,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBreakdown(!showBreakdown);
                }}
              >
                <Text
                  style={[
                    styles.viewDetailsText,
                    showBreakdown && styles.activeViewDetailsText,
                  ]}
                >
                  {showBreakdown ? "Hide Breakdown" : "View Breakdown"}
                </Text>
                {showBreakdown ? (
                  <ChevronUp size={14} color="white" />
                ) : (
                  <ChevronDown size={14} color={Theme.colors.text.onSoft} />
                )}
              </TouchableOpacity>

              <AnimatePresence>
                {showBreakdown && (
                  <MotiView
                    from={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "timing", duration: 300 }}
                    style={styles.breakdownExpand}
                  >
                    <ScopeEstimateBreakdown items={estimate.scope} />
                    <BillOfMaterialsList
                      materials={estimate.scope.flatMap(
                        (s) => s.metadata?.materials || [],
                      )}
                    />
                  </MotiView>
                )}
              </AnimatePresence>
            </>
          ) : (
            <View style={styles.breakdownItem}>
              <Check size={14} color="#2dd4bf" />
              <Text style={styles.breakdownText}>Material cost cues</Text>
            </View>
          )}
        </View>
      </GlassCard>
    </MotiView>
  );
}
