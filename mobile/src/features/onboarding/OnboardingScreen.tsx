import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { AnimatePresence, MotiView, MotiText } from "moti";
import { BlurView } from "expo-blur";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { Theme } from "@/constants/Theme";
import { supabase } from "@/lib/supabase";
import {
  saveOnboardingProject,
  ONBOARDING_SESSION_INVALID,
  type ProjectTypeOption,
  type StageOption,
} from "@/lib/onboarding-helpers";
import { clearOnboardingDraft } from "@/lib/onboarding-draft";
import { resolveZipFromCurrentLocation } from "@/lib/zip-from-location";
import {
  ONBOARDING_PRIVACY_NOTE,
  ONBOARDING_LAST_STEP_INDEX,
  ONBOARDING_PHASES,
  phaseIndexForStep,
  hasValidOnboardingZip,
} from "@shared/constants/onboarding";
import { onboardingStyles } from "@/features/onboarding/onboarding-screen.styles";
import {
  useOnboardingAnalysis,
  type OnboardingEstimateState,
} from "@/features/onboarding/hooks/useOnboardingAnalysis";
import { useOnboardingLifecycle } from "@/features/onboarding/hooks/useOnboardingLifecycle";
import { OnboardingStepContent } from "@/features/onboarding/OnboardingStepContent";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, session, signOut } = useAuth();
  const { newProject: newProjectParam, restoreOnboarding } =
    useLocalSearchParams<{
      newProject?: string;
      restoreOnboarding?: string;
    }>();
  const isAddingAnotherProject =
    newProjectParam === "1" ||
    newProjectParam === "true" ||
    newProjectParam === "yes";

  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectTypeOption | null>(
    null,
  );
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<StageOption | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [scopeDescription, setScopeDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<OnboardingEstimateState>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [locatingZip, setLocatingZip] = useState(false);

  const {
    analysisAwaitingChoice,
    analysisIndex,
    setAnalysisBarW,
    analysisBarTargetW,
    analysisMessages,
    handleAnalysisRetry,
    handleAnalysisTextOnly,
    handleAnalysisRegionalFallback,
  } = useOnboardingAnalysis(
    step,
    projectType,
    location,
    scopeDescription,
    photos,
    setEstimate,
    setStep,
  );

  const handleFillZipFromLocation = useCallback(async () => {
    try {
      setLocatingZip(true);
      const result = await resolveZipFromCurrentLocation();
      if (result.ok) {
        setLocation(result.zip);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        return;
      }
      if (result.reason === "denied") {
        Alert.alert(
          "Location access needed",
          "Allow location for this app in Settings to suggest your ZIP—or type it in.",
        );
        return;
      }
      if (result.reason === "unavailable") {
        Alert.alert(
          "Location is off",
          "Turn on location services to use this, or enter your ZIP manually.",
        );
        return;
      }
      Alert.alert(
        "Couldn’t find your ZIP",
        "We couldn’t match this area to a ZIP code. Please enter it manually.",
      );
    } catch {
      Alert.alert(
        "Something went wrong",
        "Try again in a moment, or type your ZIP code.",
      );
    } finally {
      setLocatingZip(false);
    }
  }, []);

  useOnboardingLifecycle({
    userId: user?.id,
    sessionUserId: session?.user?.id,
    isAddingAnotherProject,
    restoreOnboarding,
    setProjectType,
    setLocation,
    setStage,
    setPhotos,
    setScopeDescription,
    setEstimate,
    setStep,
  });

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return projectType != null;
      case 1:
        return hasValidOnboardingZip(location);
      case 2:
        return stage != null;
      case 3:
        return photos.length > 0 || scopeDescription.trim().length > 0;
      case 5:
        return true;
      default:
        return true;
    }
  }, [step, projectType, location, stage, photos, scopeDescription]);

  const handleComplete = async () => {
    if (!projectType || !location || !stage) {
      Alert.alert("Missing Information", "Please complete all steps.");
      return;
    }

    if (!session) {
      router.replace("/");
      return;
    }

    setLoading(true);
    try {
      const zipCode = location.replace(/\D/g, "").slice(0, 5) || "00000";
      const newProjectId = await saveOnboardingProject({
        supabase,
        userId: user!.id,
        projectType,
        stage,
        locationInput: location,
        zipCode,
        estimate: estimate
          ? {
              summary: {
                estimated_min_total: estimate.min,
                estimated_max_total: estimate.max,
                confidence_score: estimate.confidence,
              },
              scope_items: estimate.scope ?? [],
            }
          : null,
        photos: photos.map((p) => ({ uri: p })),
      });

      // Automatically switch to the new project so it loads on the dashboard
      await AsyncStorage.setItem("bluprnt_project_id", newProjectId);
      await supabase.from("user_preferences").upsert({
        user_id: user!.id,
        last_active_project_id: newProjectId,
        updated_at: new Date().toISOString(),
      });

      await clearOnboardingDraft();
      setLoading(false);
      router.replace("/(tabs)");
    } catch (err) {
      const error = err as Error;
      const msg = error.message || "";
      setLoading(false);

      const authRowMissing =
        msg === ONBOARDING_SESSION_INVALID ||
        msg.includes("properties_owner_user_id_fkey") ||
        /owner_user_id_fkey/i.test(msg);

      if (authRowMissing) {
        await signOut();
        Alert.alert(
          "Sign in again",
          "We couldn’t confirm your account. If your profile changed or was removed, sign in again—then you can finish saving your project.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
        );
        return;
      }

      Alert.alert(
        "Couldn’t save yet",
        "We couldn’t finish saving. Check your connection and tap Save again—your project details are still on this screen.",
      );
    }
  };

  const handleNext = () => {
    if (step <= 3 && !canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Analysis is automated
    } else if (step < ONBOARDING_LAST_STEP_INDEX) {
      setStep(step + 1);
    } else {
      void handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 5) {
      setStep(3);
    } else if (step > 0) {
      setStep(step - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }
  };

  return (
    <ScreenWrapper
      withScroll={false}
      withKeyboard
      edges={["top", "left", "right"]}
    >
      <StatusBar style="dark" />
      <View style={onboardingStyles.screenColumn}>
        <View style={onboardingStyles.header}>
          <View style={onboardingStyles.headerNavRow}>
            <TouchableOpacity
              onPress={handleBack}
              style={onboardingStyles.backButton}
            >
              <ChevronLeft size={24} color={Theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={onboardingStyles.progressSection}>
            <View style={onboardingStyles.progressContainer}>
              {ONBOARDING_PHASES.map((_, i) => {
                const phaseNow = phaseIndexForStep(step);
                return (
                  <View
                    key={i}
                    style={[
                      onboardingStyles.progressBar,
                      { flex: 1 },
                      i > 0 && { marginLeft: 8 },
                      i <= phaseNow && onboardingStyles.progressBarActive,
                    ]}
                  />
                );
              })}
            </View>
            <AnimatePresence exitBeforeEnter>
              <MotiText
                key={phaseIndexForStep(step)}
                from={{ opacity: 0, translateY: 4 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -4 }}
                transition={{ type: "timing", duration: 300 }}
                style={onboardingStyles.phaseLabel}
                numberOfLines={1}
              >
                {ONBOARDING_PHASES[phaseIndexForStep(step)].label}
              </MotiText>
            </AnimatePresence>
          </View>
        </View>

        <ScrollView
          style={onboardingStyles.stepScroll}
          contentContainerStyle={onboardingStyles.stepScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={step}
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: "timing", duration: 400 }}
              style={{ flex: 1 }}
            >
              <OnboardingStepContent
                step={step}
                onboardingStyles={onboardingStyles}
                projectType={projectType}
                setProjectType={setProjectType}
                location={location}
                setLocation={setLocation}
                locatingZip={locatingZip}
                onFillZipFromLocation={handleFillZipFromLocation}
                stage={stage}
                setStage={setStage}
                photos={photos}
                setPhotos={setPhotos}
                scopeDescription={scopeDescription}
                setScopeDescription={setScopeDescription}
                analysisAwaitingChoice={analysisAwaitingChoice}
                onAnalysisRetry={handleAnalysisRetry}
                onAnalysisTextOnly={handleAnalysisTextOnly}
                onAnalysisRegionalFallback={handleAnalysisRegionalFallback}
                analysisBarTargetW={analysisBarTargetW}
                onAnalysisBarLayout={setAnalysisBarW}
                analysisIndex={analysisIndex}
                analysisMessages={analysisMessages}
                estimate={estimate}
                showBreakdown={showBreakdown}
                setShowBreakdown={setShowBreakdown}
                session={session}
                onComplete={handleComplete}
              />
            </MotiView>
          </AnimatePresence>
          {step <= 2 ? (
            <Text
              testID="onboarding-privacy-note"
              style={onboardingStyles.privacyNote}
              accessibilityRole="text"
              accessibilityLabel={ONBOARDING_PRIVACY_NOTE}
            >
              {ONBOARDING_PRIVACY_NOTE}
            </Text>
          ) : null}
        </ScrollView>

        {step < ONBOARDING_LAST_STEP_INDEX && step !== 4 && (
          <View
            style={[
              onboardingStyles.footer,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <Button
              title="Continue"
              titleCase="sentence"
              onPress={handleNext}
              loading={loading}
              disabled={step <= 3 && !canContinue}
              accessibilityLabel={
                step <= 3 && !canContinue
                  ? "Continue, complete this step first"
                  : "Continue"
              }
              testID="onboarding-continue"
              icon={<ChevronRight size={20} color="white" />}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
