import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import {
  Check,
  ArrowRight,
  UserPlus,
  LogIn,
  Monitor,
} from "lucide-react-native";
import { router } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Theme } from "@/constants/Theme";
import { persistOnboardingDraft } from "@/lib/onboarding-draft";
import type { ProjectTypeOption, StageOption } from "@/lib/onboarding-helpers";
import type { OnboardingEstimateState } from "@/features/onboarding/hooks/useOnboardingAnalysis";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";
import { SyncDraftModal } from "./SyncDraftModal";

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
  const [showSync, setShowSync] = useState(false);

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
            usedFallback: estimate.usedFallback,
            fallbackReason: estimate.fallbackReason ?? null,
          }
        : null,
    });
    router.push(path);
  };

  const draftPayload = {
    projectType,
    location,
    stage,
    scopeDescription,
    estimate: estimate
      ? {
          summary: {
            estimated_min_total: estimate.min,
            estimated_max_total: estimate.max,
            confidence_score: estimate.confidence,
          },
          scope_items: estimate.scope,
        }
      : null,
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

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.handoffBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSync(true);
              }}
            >
              <Monitor size={18} color={Theme.colors.text.secondary} />
              <Text style={styles.handoffBtnText}>Continue on computer</Text>
            </TouchableOpacity>
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

      <SyncDraftModal
        isOpen={showSync}
        onClose={() => setShowSync(false)}
        payload={draftPayload}
      />
    </MotiView>
  );
}
