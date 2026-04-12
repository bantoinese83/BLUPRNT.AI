import React from "react";
import { View, Text } from "react-native";
import { MotiView } from "moti";
import { AlertCircle } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { Theme } from "@/constants/Theme";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";

interface AnalysisStepProps {
  styles: OnboardingStyles;
  analysisAwaitingChoice: boolean;
  onAnalysisRetry: () => void;
  onAnalysisTextOnly: () => void;
  onAnalysisRegionalFallback: () => void;
  analysisBarTargetW: number;
  onAnalysisBarLayout: (w: number) => void;
  analysisIndex: number;
  analysisMessages: string[];
}

export function AnalysisStep({
  styles,
  analysisAwaitingChoice,
  onAnalysisRetry,
  onAnalysisTextOnly,
  onAnalysisRegionalFallback,
  analysisBarTargetW,
  onAnalysisBarLayout,
  analysisIndex,
  analysisMessages,
}: AnalysisStepProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key="step4"
      style={styles.analysisStepRoot}
    >
      {analysisAwaitingChoice ? (
        <>
          <View style={styles.analysisChoiceIconWrap}>
            <AlertCircle
              size={40}
              color={Theme.colors.brand.primary}
              accessibilityLabel=""
            />
          </View>
          <View style={{ paddingHorizontal: 20, alignItems: "center" }}>
            <Text style={styles.analysisTitle}>
              We couldn’t finish analysis
            </Text>
            <Text style={[styles.analysisChoiceBody, { textAlign: "center" }]}>
              Your photos might not have gone through, or the service was busy.
              Choose how you'd like to proceed:
            </Text>
          </View>

          <View
            style={[styles.analysisChoiceActions, { gap: 12, marginTop: 24 }]}
          >
            <Button
              title="Try again with photos"
              onPress={onAnalysisRetry}
              style={{ width: "100%" }}
            />
            <Button
              title="Use my description only"
              onPress={onAnalysisTextOnly}
              variant="outline"
              style={{ width: "100%" }}
            />
            <Button
              title="Use general regional range"
              onPress={onAnalysisRegionalFallback}
              variant="outline"
              style={{ width: "100%" }}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.analysisLoaderCluster}>
            <MotiView
              from={{ opacity: 0.4, scale: 0.92 }}
              animate={{ opacity: 0.75, scale: 1 }}
              transition={{
                type: "timing",
                duration: 2800,
                loop: true,
                repeatReverse: true,
              }}
              style={styles.analysisLoaderGlow}
            />
            <SnurraLoader
              size={SnurraSize.hero}
              showLogo
              accessibilityLabel="Building your estimate"
            />
          </View>

          <Text style={styles.analysisTitle}>Building your BLUPRNT</Text>
          <Text style={styles.analysisLeadSubtitle}>
            Generating real-world market data
          </Text>

          <MotiView
            key={analysisIndex}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450 }}
            style={styles.analysisMessageWrap}
          >
            <Text style={styles.analysisSubtitle}>
              {analysisMessages[analysisIndex]}
            </Text>
          </MotiView>

          <View
            style={styles.analysisProgressTrack}
            accessibilityRole="progressbar"
            accessibilityLabel="Analysis in progress"
            onLayout={(e) => onAnalysisBarLayout(e.nativeEvent.layout.width)}
          >
            <MotiView
              key={Math.round(analysisBarTargetW)}
              style={[
                styles.analysisProgressFill,
                { width: analysisBarTargetW * 0.02 },
              ]}
              from={{ width: analysisBarTargetW * 0.02 }}
              animate={{ width: analysisBarTargetW * 0.92 }}
              transition={{ type: "timing", duration: 5_000 }}
            />
          </View>
          <Text style={styles.analysisFooterMicro}>
            Scanning Database Assets
          </Text>
        </>
      )}
    </MotiView>
  );
}
