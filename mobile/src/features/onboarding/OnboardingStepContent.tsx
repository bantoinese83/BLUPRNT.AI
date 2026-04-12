import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronDown,
  ChevronUp,
  Check,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  MapPin,
} from "lucide-react-native";
import { Image as ExpoImage } from "expo-image";
import galleryAsset from "../../../assets/onboarding/gallery.svg";
import cameraAsset from "../../../assets/onboarding/camera.svg";
import { router } from "expo-router";
import { money } from "../../../../shared/lib/formatters";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { SnurraLoader, SnurraSize } from "../../components/ui/SnurraLoader";
import { ProjectIcon } from "../../lib/project-icons";
import { Theme } from "../../constants/Theme";
import { persistOnboardingDraft } from "../../lib/onboarding-draft";
import type { ProjectTypeOption } from "../../lib/onboarding-helpers";
import { ScopeEstimateBreakdown } from "./components/ScopeEstimateBreakdown";
import { MaterialDetailList } from "./components/MaterialDetailList";
import { hasValidOnboardingZip } from "./onboarding-constants";
import type { OnboardingStepContentProps } from "./onboarding-step-types";

export function OnboardingStepContent(props: OnboardingStepContentProps) {
  const styles = props.onboardingStyles;
  const {
    step,
    projectType,
    setProjectType,
    location,
    setLocation,
    locatingZip,
    onFillZipFromLocation,
    stage,
    setStage,
    photos,
    setPhotos,
    scopeDescription,
    setScopeDescription,
    analysisAwaitingChoice,
    onAnalysisRetry,
    onAnalysisTextOnly,
    onAnalysisRegionalFallback,
    analysisBarTargetW,
    onAnalysisBarLayout,
    analysisIndex,
    analysisMessages,
    estimate,
    showBreakdown,
    setShowBreakdown,
    session,
    onComplete,
  } = props;

  switch (step) {
    case 0:
      return (
        <MotiView
          from={{ opacity: 0, translateX: 50 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -50 }}
          key="step0"
        >
          <Text style={styles.stepTitle}>What are you working on first?</Text>
          <Text style={styles.stepSubtitle}>
            You can add more projects later.
          </Text>
          <View style={styles.iconGrid}>
            {[
              { name: "Kitchen" },
              { name: "Bathroom" },
              { name: "Painting" },
              { name: "Roof" },
              { name: "Flooring" },
              { name: "Something else" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.name}
                style={[
                  styles.iconCard,
                  projectType === opt.name && styles.iconCardActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setProjectType(opt.name as ProjectTypeOption);
                }}
              >
                <View
                  style={[
                    styles.iconCircleBig,
                    projectType === opt.name && styles.iconCircleBigActive,
                  ]}
                >
                  <ProjectIcon name={opt.name} size={36} />
                </View>
                <Text
                  style={[
                    styles.iconLabel,
                    projectType === opt.name && styles.iconLabelActive,
                  ]}
                >
                  {opt.name}
                </Text>
                {projectType === opt.name && (
                  <View style={styles.checkSeal}>
                    <Check size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>
      );
    case 1:
      return (
        <MotiView
          from={{ opacity: 0, translateX: 50 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -50 }}
          key="step1"
        >
          <Text style={styles.stepTitle}>Where is this home?</Text>
          <Text style={styles.stepSubtitle}>
            We use your area to ground costs in real numbers, not guesses.
          </Text>
          <GlassCard intensity={20} style={styles.inputCard}>
            <View style={styles.zipInputRow}>
              <TextInput
                style={styles.zipTextInput}
                placeholder="Enter ZIP code"
                placeholderTextColor={Theme.colors.text.muted}
                value={location}
                onChangeText={setLocation}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={5}
                editable={!locatingZip}
                accessibilityLabel="ZIP code"
              />
              <TouchableOpacity
                style={[
                  styles.zipLocateButton,
                  locatingZip && styles.zipLocateButtonDisabled,
                ]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void onFillZipFromLocation();
                }}
                disabled={locatingZip}
                accessibilityRole="button"
                accessibilityLabel="Use current location to fill ZIP code"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {locatingZip ? (
                  <SnurraLoader size={22} />
                ) : (
                  <MapPin
                    size={22}
                    color={Theme.colors.brand.primary}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
          <Text style={styles.zipLocateHint}>
            Tap the pin to use this device’s location once for your ZIP.
          </Text>
        </MotiView>
      );
    case 2:
      return (
        <MotiView
          from={{ opacity: 0, translateX: 50 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -50 }}
          key="step2"
        >
          <Text style={styles.stepTitle}>Where are you in the process?</Text>
          <View style={{ gap: 12, marginTop: 20 }}>
            {(
              [
                {
                  name: "Just planning" as const,
                  description:
                    "Exploring possibilities and getting a rough idea of costs.",
                },
                {
                  name: "Collecting quotes" as const,
                  description:
                    "Actively talking to contractors and comparing estimates.",
                },
                {
                  name: "Already started work" as const,
                  description:
                    "Managing an ongoing project and tracking expenses.",
                },
              ] as const
            ).map((s) => (
              <TouchableOpacity
                key={s.name}
                style={[
                  styles.stageButton,
                  stage === s.name && styles.stageButtonActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStage(s.name);
                }}
              >
                <View
                  style={[
                    styles.stageIconContainer,
                    stage === s.name && styles.stageIconContainerActive,
                  ]}
                >
                  <ProjectIcon name={s.name} size={28} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      styles.stageText,
                      stage === s.name && styles.stageTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                  <Text style={styles.stageDescription}>{s.description}</Text>
                </View>
                {stage === s.name && (
                  <Check size={20} color={Theme.colors.brand.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>
      );
    case 3:
      return (
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          key="step3"
          style={styles.visionContainer}
        >
          <Text style={styles.stepTitle}>Vision-Match your room</Text>
          <Text style={styles.stepSubtitle}>
            Add at least one photo or a short description so we can tailor your
            estimate.
          </Text>

          <View style={styles.visionActions}>
            <TouchableOpacity
              style={styles.visionButton}
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: "images",
                  quality: 0.8,
                  allowsMultipleSelection: true,
                });
                if (!result.canceled) {
                  setPhotos([...photos, ...result.assets.map((a) => a.uri)]);
                }
              }}
            >
              <View
                style={[
                  styles.visionIcon,
                  { backgroundColor: Theme.colors.brand.primary + "18" },
                ]}
              >
                <ExpoImage
                  source={galleryAsset}
                  style={styles.visionAsset}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.visionLabel}>Gallery</Text>
              <Text style={styles.visionHint}>Upload photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.visionButton}
              onPress={async () => {
                const { status } =
                  await ImagePicker.requestCameraPermissionsAsync();
                if (status !== "granted") return;
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ["images"],
                  quality: 0.8,
                });
                if (!result.canceled)
                  setPhotos([...photos, result.assets[0].uri]);
              }}
            >
              <View
                style={[
                  styles.visionIcon,
                  { backgroundColor: Theme.colors.brand.primary + "18" },
                ]}
              >
                <ExpoImage
                  source={cameraAsset}
                  style={styles.visionAsset}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.visionLabel}>Camera</Text>
              <Text style={styles.visionHint}>Snap your space</Text>
            </TouchableOpacity>
          </View>

          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.photoThumb}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPhotos(photos.filter((_, idx) => idx !== i));
                  }}
                >
                  <Image source={{ uri: p }} style={StyleSheet.absoluteFill} />
                  <View style={styles.photoRemoveOverlay}>
                    <AlertCircle size={10} color="white" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <GlassCard intensity={15} style={styles.scopeInputCard}>
            <TextInput
              style={styles.scopeInput}
              placeholder="Or describe the project here…"
              placeholderTextColor={Theme.colors.text.secondary}
              multiline
              value={scopeDescription}
              onChangeText={setScopeDescription}
            />
          </GlassCard>
        </MotiView>
      );
    case 4:
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
              <Text style={styles.analysisTitle}>
                We couldn’t finish analysis
              </Text>
              <Text style={styles.analysisChoiceBody}>
                Your photos might not have gone through, or the service was
                busy. Try again, run without photos if you added notes, or
                continue with a solid range for your area.
              </Text>
              <View style={styles.analysisChoiceActions}>
                <Button
                  title="Try again"
                  onPress={onAnalysisRetry}
                  style={styles.analysisChoiceBtn}
                />
                <Button
                  title="Use notes only"
                  onPress={onAnalysisTextOnly}
                  variant="outline"
                  style={styles.analysisChoiceBtn}
                />
                <Button
                  title="Continue with regional range"
                  onPress={onAnalysisRegionalFallback}
                  variant="outline"
                  style={styles.analysisChoiceBtn}
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
                onLayout={(e) =>
                  onAnalysisBarLayout(e.nativeEvent.layout.width)
                }
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
    case 5:
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
                <TrendingUp size={12} color={Theme.colors.brand.light} />
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
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }}
            >
              <Text style={styles.estimateValue}>
                {money(estimate?.min ?? 0, estimate?.max ?? 0)}
              </Text>
            </MotiView>

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
                      <ChevronDown
                        size={14}
                        color={Theme.colors.text.secondary}
                      />
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
                        <MaterialDetailList
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
    case 6:
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
                  onPress={() => {
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
                    router.push("/(auth)/register");
                  }}
                  icon={<UserPlus size={20} color="white" />}
                />
                <Button
                  title="Sign in"
                  titleCase="sentence"
                  variant="outline"
                  onPress={() => {
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
                    router.push("/(auth)/login");
                  }}
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
    default:
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: "white" }}>Initializing...</Text>
        </View>
      );
  }
}
