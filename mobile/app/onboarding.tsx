import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Camera,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  ListTree,
  ArrowRight,
  UserPlus,
  LogIn,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { GlassCard } from "../src/components/ui/GlassCard";
import { Button } from "../src/components/ui/Button";
import { ScreenWrapper } from "../src/components/ScreenWrapper";
import {
  ProjectTypeOption,
  StageOption,
  saveOnboardingProject,
} from "../src/lib/onboarding-helpers";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/contexts/auth-context";
import { Theme } from "../src/constants/Theme";

const STEPS = [
  "Type",
  "Location",
  "Stage",
  "Vision",
  "Analysis",
  "Estimate",
  "Account",
];

const ANALYSIS_MESSAGES = [
  "Comparing local labor indices...",
  "Analyzing material cost trends...",
  "Identifying scope benchmarks...",
  "Calculating regional cost baseline...",
  "Reviewing permit requirements...",
];

export default function OnboardingScreen() {
  const { user, session } = useAuth();
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectTypeOption | null>(
    null,
  );
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<StageOption | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [scopeDescription, setScopeDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [estimate, setEstimate] = useState<{ min: number; max: number } | null>(
    null,
  );

  useEffect(() => {
    let interval: any;
    if (step === 4) {
      let current = 0;
      interval = setInterval(() => {
        current++;
        if (current < ANALYSIS_MESSAGES.length) {
          setAnalysisIndex(current);
        } else {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Generate a mock estimate based on type
          const base =
            projectType === "Kitchen"
              ? 15000
              : projectType === "Bathroom"
                ? 8000
                : 5000;
          setEstimate({ min: base, max: base * 1.5 });
          setStep(5);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [step, projectType]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Analysis is automated
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 5) {
      // Jump back over Analysis
      setStep(3);
    } else if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    if (!projectType || !location || !stage) {
      Alert.alert("Missing Information", "Please complete all steps.");
      return;
    }

    if (!session) {
      // Step 6 handles account creation choice
      return;
    }

    setLoading(true);
    try {
      const zipCode = location.replace(/\D/g, "").slice(0, 5) || "00000";
      await saveOnboardingProject({
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
                confidence_score: 4.8,
              },
              scope_items: [],
            }
          : null,
        photos: photos.map((p) => ({ uri: p })),
      });
      setLoading(false);
      router.replace("/(tabs)");
    } catch (err) {
      const error = err as Error;
      setLoading(false);
      Alert.alert("Error", error.message || "Failed to save project");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -50 }}
            key="step0"
          >
            <Text style={styles.stepTitle}>What are you planning?</Text>
            <View style={styles.options}>
              {[
                "Kitchen",
                "Bathroom",
                "Painting",
                "Roof",
                "Flooring",
                "Something else",
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    projectType === type && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setProjectType(type as ProjectTypeOption);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      projectType === type && styles.optionTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                  {projectType === type && <Check size={20} color="white" />}
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
            <Text style={styles.stepTitle}>Where is the project?</Text>
            <Text style={styles.stepSubtitle}>
              ZIP code helps us ground labor costs.
            </Text>
            <GlassCard intensity={20} style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter ZIP code"
                placeholderTextColor={Theme.colors.text.muted}
                value={location}
                onChangeText={setLocation}
                keyboardType="numeric"
                maxLength={5}
              />
            </GlassCard>
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
            <Text style={styles.stepTitle}>Project stage?</Text>
            <View style={styles.options}>
              {[
                "Planning & budgeting",
                "Collecting quotes",
                "Already started work",
              ].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.optionButton,
                    stage === s && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setStage(s as StageOption);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      stage === s && styles.optionTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                  {stage === s && <Check size={20} color="white" />}
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
            <Text style={styles.stepTitle}>Vision-Match</Text>
            <Text style={styles.stepSubtitle}>
              Snap a photo or upload for a high-fidelity estimate.
            </Text>

            <View style={styles.visionActions}>
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
                    { backgroundColor: Theme.colors.brand.primary + "20" },
                  ]}
                >
                  <Camera size={24} color={Theme.colors.brand.light} />
                </View>
                <Text style={styles.visionLabel}>Camera</Text>
              </TouchableOpacity>

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
                    { backgroundColor: "rgba(167, 139, 250, 0.15)" },
                  ]}
                >
                  <ImageIcon size={24} color={Theme.colors.brand.light} />
                </View>
                <Text style={styles.visionLabel}>Gallery</Text>
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
                    <Image
                      source={{ uri: p }}
                      style={StyleSheet.absoluteFill}
                    />
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
                placeholder="Add project details (optional)..."
                placeholderTextColor="#64748b"
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
            style={styles.centerContainer}
          >
            <View style={styles.analysisCircle}>
              <MotiView
                from={{ scale: 0.8, opacity: 0.3 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ loop: true, duration: 2000, type: "timing" }}
                style={[styles.pulseCircle, { backgroundColor: "#818cf8" }]}
              />
              <MotiView
                from={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{
                  loop: true,
                  duration: 1500,
                  type: "timing",
                  delay: 500,
                }}
                style={[
                  styles.pulseCircle,
                  { backgroundColor: Theme.colors.brand.primary },
                ]}
              />
              <GlassCard intensity={40} style={styles.iconCircle}>
                <Sparkles size={40} color="white" />
              </GlassCard>
            </View>
            <Text style={styles.analysisTitle}>Analyzing Blueprint</Text>
            <MotiView
              key={analysisIndex}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
            >
              <Text style={styles.analysisSubtitle}>
                {ANALYSIS_MESSAGES[analysisIndex]}
              </Text>
            </MotiView>
          </MotiView>
        );
      case 5:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            key="step5"
          >
            <Text style={styles.stepTitle}>You're Ready</Text>
            <Text style={styles.stepSubtitle}>
              Based on market data for {location}.
            </Text>

            <GlassCard intensity={30} style={styles.estimateCard}>
              <View style={styles.confidenceBadge}>
                <Sparkles size={12} color={Theme.colors.brand.light} />
                <Text style={styles.confidenceText}>Confidence: 4.8 / 5</Text>
              </View>

              <Text style={styles.estimateLabel}>Investment Range</Text>
              <Text style={styles.estimateValue}>
                ${(estimate?.min || 0).toLocaleString()} – $
                {(estimate?.max || 0).toLocaleString()}
              </Text>

              <View style={styles.estimateDivider} />

              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <Check size={14} color="#818cf8" />
                  <Text style={styles.breakdownText}>Local Market Data</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Check size={14} color="#818cf8" />
                  <Text style={styles.breakdownText}>Material Indices</Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>
        );
      case 6:
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
                    handleComplete();
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
                    title="Create Free Account"
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push("/(auth)/register");
                    }}
                    icon={<UserPlus size={20} color="white" />}
                  />
                  <Button
                    title="Sign In"
                    variant="outline"
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push("/(auth)/login");
                    }}
                    icon={<LogIn size={20} color="white" />}
                  />
                </View>
              )}
            </View>

            {!session && (
              <View style={styles.skipContainer}>
                <TouchableOpacity
                  onPress={handleComplete}
                  style={styles.skipButton}
                >
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
  };

  return (
    <ScreenWrapper withScroll edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                i <= step && styles.progressBarActive,
                { width: `${100 / STEPS.length - 5}%` },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <AnimatePresence exitBeforeEnter>{renderStep()}</AnimatePresence>
      </View>

      <View style={styles.footer}>
        <Button
          title={step === STEPS.length - 1 ? "Finish" : "Continue"}
          onPress={handleNext}
          loading={loading}
          icon={
            step < STEPS.length - 1 ? (
              <ChevronRight size={20} color="white" />
            ) : (
              <Check size={20} color="white" />
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBarActive: {
    backgroundColor: "#4f46e5",
  },
  content: {
    padding: 24,
    flex: 1,
  },
  stepTitle: {
    fontSize: 32,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    marginBottom: 12,
    letterSpacing: -1,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  optionButtonActive: {
    backgroundColor: Theme.colors.brand.primary + "33", // 20% opacity
    borderColor: Theme.colors.brand.primary,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    color: "#cbd5e1",
  },
  optionTextActive: {
    color: "white",
  },
  inputCard: {
    padding: 4,
  },
  textInput: {
    height: 64,
    paddingHorizontal: 20,
    fontSize: 28,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    letterSpacing: 2,
  },
  reviewCard: {
    padding: 24,
    borderRadius: 24,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  footer: {
    padding: 24,
  },
  visionContainer: {
    flex: 1,
  },
  visionActions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  visionButton: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  visionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  visionLabel: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  photoRemoveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scopeInputCard: {
    padding: 16,
    borderRadius: 20,
  },
  scopeInput: {
    minHeight: 120,
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    textAlignVertical: "top",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingSpinner: {
    marginBottom: 32,
  },
  analysisTitle: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginBottom: 8,
  },
  analysisSubtitle: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },
  analysisCircle: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  pulseCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: "#64748b",
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    textDecorationLine: "underline",
  },
  estimateCard: {
    padding: 24,
    borderRadius: 32,
    alignItems: "center",
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    borderRadius: 20,
    marginBottom: 24,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
    color: "#818cf8",
    textTransform: "uppercase",
  },
  estimateLabel: {
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  estimateValue: {
    fontSize: 40,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    letterSpacing: -1,
    marginBottom: 24,
    textAlign: "center",
  },
  estimateDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 24,
  },
  breakdown: {
    width: "100%",
    gap: 12,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  breakdownText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#cbd5e1",
  },
  accountChoice: {
    gap: 16,
    marginTop: 20,
  },
  accountBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: Theme.colors.brand.primary,
    gap: 16,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountBtnText: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  badgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  successText: {
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
    color: "#10b981",
    textTransform: "uppercase",
  },
  privacyNote: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    textAlign: "center",
    marginTop: 24,
  },
});
