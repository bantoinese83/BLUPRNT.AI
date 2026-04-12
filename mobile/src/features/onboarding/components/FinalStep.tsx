import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Check, ArrowRight, UserPlus, LogIn } from "lucide-react-native";
import { router } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Theme } from "@/constants/Theme";
import { persistOnboardingDraft } from "@/lib/onboarding-draft";
import type { ProjectTypeOption, StageOption } from "@/lib/onboarding-helpers";
import type { OnboardingEstimateState } from "@/features/onboarding/hooks/useOnboardingAnalysis";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";

interface FinalStepProps {
  styles: OnboardingStyles;
  session: Session | null;
  onComplete: () => void;
  projectType: ProjectTypeOption | null;
  location: string;
  stage: StageOption | null;
  photos: string[];
  scopeDescription: string;
  estimate: OnboardingEstimateState;
}

export function FinalStep({
  styles,
  session,
  onComplete,
  projectType,
  location,
  stage,
  photos,
  scopeDescription,
  estimate,
}: FinalStepProps) {
  const handleAuthNavigation = (path: "/(auth)/register" | "/(auth)/login") => {
    Haptics.selectionAsync();
    void persistOnboardingDraft({
      v: 1,
      projectType,
      location,
      stage,
      photos,
      scopeDescription,
      estimate: estimate
        ? {
            min: estimate.min,
            max: estimate.max,
            scope: estimate.scope,
            confidence: estimate.confidence,
          }
        : null,
    });
    router.push(path);
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key="step6-final"
      style={styles.visionContainer}
    >
      <View style={styles.badgeContainer}>
        <View style={styles.successBadge}>
          <Check size={12} color={Theme.colors.status.success} />
          <Text style={styles.successText}>Estimate Generated</Text>
        </View>
      </View>

      <Text style={styles.stepTitle}>
        {session ? "Everything is set!" : "Save Your Progress"}
      </Text>
      <Text style={styles.stepSubtitle}>
        {session
          ? "Your custom renovation blueprint has been created. Let's head to your dashboard."
          : "Create an account to save this estimate and access local material matching."}
      </Text>

      <View style={styles.accountChoice}>
        {session ? (
          <TouchableOpacity
            style={styles.accountBtn}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              onComplete();
            }}
          >
            <View style={styles.accountIcon}>
              <ArrowRight size={24} color="white" />
            </View>
            <Text style={styles.accountBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 16 }}>
            <Button
              title="Create free account"
              titleCase="sentence"
              onPress={() => handleAuthNavigation("/(auth)/register")}
              icon={<UserPlus size={20} color="white" />}
            />
            <Button
              title="Sign in"
              titleCase="sentence"
              variant="outline"
              onPress={() => handleAuthNavigation("/(auth)/login")}
              icon={<LogIn size={20} color="white" />}
            />
          </View>
        )}
      </View>

      {!session && (
        <View style={styles.skipContainer}>
          <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
            <Text style={styles.skipText}>Finish without saving</Text>
          </TouchableOpacity>
        </View>
      )}
    </MotiView>
  );
}
