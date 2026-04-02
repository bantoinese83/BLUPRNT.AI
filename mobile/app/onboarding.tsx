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
import { StatusBar } from "expo-status-bar";
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
  ArrowRight,
  UserPlus,
  LogIn,
  Package,
  Boxes,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { money } from "../src/lib/formatters";
import { GlassCard } from "../src/components/ui/GlassCard";
import { Button } from "../src/components/ui/Button";
import { ScreenWrapper } from "../src/components/ScreenWrapper";
import {
  ProjectTypeOption,
  StageOption,
  saveOnboardingProject,
  projectTypeToRoomType,
  PhotoToScopeResult,
} from "../src/lib/onboarding-helpers";
import { ProjectIcon } from "../src/lib/project-icons";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/contexts/auth-context";
import { Theme } from "../src/constants/Theme";
import { getRangeForType } from "../src/constants/estimateRanges";

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

function MaterialDetailList({
  materials,
}: {
  materials: {
    name: string;
    brand?: string;
    quantity?: number | string;
    unit?: string;
  }[];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <View style={styles.materialContainer}>
      <View style={styles.materialHeader}>
        <Package size={12} color={Theme.colors.brand.primary} />
        <Text style={styles.materialHeaderText}>Bill of Materials</Text>
      </View>
      <View style={styles.materialGrid}>
        {materials.map((m, idx: number) => (
          <View key={idx} style={styles.materialCard}>
            <View style={styles.materialIconBg}>
              <Boxes size={14} color={Theme.colors.text.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{m.name}</Text>
              <View style={styles.materialMetaRow}>
                {m.brand && (
                  <View style={styles.brandTag}>
                    <Tag size={10} color={Theme.colors.brand.primary} />
                    <Text style={styles.brandText}>{m.brand}</Text>
                  </View>
                )}
                {m.quantity && (
                  <Text style={styles.materialQuantity}>
                    {m.quantity} {m.unit || "units"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

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
  const [estimate, setEstimate] = useState<{
    min: number;
    max: number;
    scope: PhotoToScopeResult["scope_items"];
  } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const runAnalysis = React.useCallback(async () => {
    try {
      const fd = new FormData();
      // Extract zip from location string (simple 5-digit match)
      const zipMatch = location.match(/\d{5}/);
      const zip = zipMatch ? zipMatch[0] : "00000";

      fd.append("zip_code", zip);
      fd.append("room_type", projectTypeToRoomType(projectType));
      fd.append("finish_preference", "mid");

      if (scopeDescription?.trim()) {
        fd.append("scope_description", scopeDescription.trim());
      }

      photos.forEach((uri, index) => {
        // @ts-expect-error: React Native FormData needs this object format
        fd.append("photos[]", {
          uri,
          name: `vision_asset_${index}.jpg`,
          type: "image/jpeg",
        });
      });

      const { data, error } = await supabase.functions.invoke(
        "photo-to-scope",
        {
          body: fd,
        },
      );

      if (error || !data) {
        throw new Error(error?.message || "AI Analysis failed");
      }

      const result = data as PhotoToScopeResult;
      setEstimate({
        min: result.summary.estimated_min_total,
        max: result.summary.estimated_max_total,
        scope: result.scope_items,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(5);
    } catch (err) {
      console.error("Analysis Error:", err);
      // Fallback to a type-based range if AI fails, but mark it clearly
      const range = getRangeForType(projectType);
      setEstimate({ min: range.min, max: range.max, scope: [] });
      setStep(5);
      Alert.alert(
        "Regional Estimation",
        "We couldn't perform a deep vision analysis on these photos, so we've provided a refined regional estimate based on your project type.",
      );
    }
  }, [location, projectType, scopeDescription, photos]);

  useEffect(() => {
    // Skip onboarding if user already has projects (Fast-track)
    const checkExistingProjects = async () => {
      if (user) {
        const { count, error } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (!error && count && count > 0) {
          router.replace("/(tabs)");
        }
      }
    };
    checkExistingProjects();

    let messageInterval: ReturnType<typeof setInterval>;
    if (step === 4) {
      let current = 0;
      messageInterval = setInterval(() => {
        current = (current + 1) % ANALYSIS_MESSAGES.length;
        setAnalysisIndex(current);
      }, 2000);

      runAnalysis();
    }
    return () => clearInterval(messageInterval);
  }, [step, projectType, user, runAnalysis]);

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
      // Explicitly navigate back or replace to ensure no "hang" on step 0
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/"); // Go to Landing Carousel
      }
    }
  };

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
              // Pass full AI-generated scope so BOM is persisted to DB
              scope_items: estimate.scope ?? [],
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
                    <ProjectIcon
                      name={opt.name}
                      size={32}
                      color={
                        projectType === opt.name
                          ? Theme.colors.brand.primary
                          : Theme.colors.text.secondary
                      }
                    />
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
            <View style={{ gap: 12, marginTop: 20 }}>
              {[
                { name: "Planning & budgeting" },
                { name: "Collecting quotes" },
                { name: "Already started work" },
              ].map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={[
                    styles.stageButton,
                    stage === s.name && styles.stageButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setStage(s.name as StageOption);
                  }}
                >
                  <View
                    style={[
                      styles.stageIconContainer,
                      stage === s.name && styles.stageIconContainerActive,
                    ]}
                  >
                    <ProjectIcon
                      name={s.name}
                      size={24}
                      color={
                        stage === s.name
                          ? Theme.colors.brand.primary
                          : Theme.colors.text.secondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.stageText,
                      stage === s.name && styles.stageTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
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
                <ProjectIcon
                  name={projectType || ""}
                  size={40}
                  color={Theme.colors.brand.primary}
                />
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
            exit={{ opacity: 0, translateY: -20 }}
            key="step5"
          >
            <Text style={styles.stepTitle}>You're Ready</Text>
            <Text style={styles.stepSubtitle}>
              Based on market data for {location}.
            </Text>

            <GlassCard intensity={30} style={styles.estimateCard}>
              <View style={styles.estimateHeader}>
                <View style={styles.estimateIconCircle}>
                  <ProjectIcon
                    name={projectType || ""}
                    size={32}
                    color={Theme.colors.brand.primary}
                  />
                </View>
                <View style={styles.confidenceBadge}>
                  <Sparkles size={12} color={Theme.colors.brand.light} />
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
                Based on your project type. Your exact AI-powered estimate is
                generated after photo analysis.
              </Text>

              <View style={styles.estimateDivider} />

              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <Check size={14} color="#818cf8" />
                  <Text style={styles.breakdownText}>National Labor Data</Text>
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
                          style={{ overflow: "hidden", width: "100%" }}
                        >
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
                    <Check size={14} color="#818cf8" />
                    <Text style={styles.breakdownText}>Material Indices</Text>
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
    <ScreenWrapper
      withScroll
      withTabBar={false}
      withKeyboard
      edges={["top", "bottom", "left", "right"]}
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#0f172a" />
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

      {step < STEPS.length - 1 && (
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleNext}
            loading={loading}
            icon={<ChevronRight size={20} color="white" />}
          />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginTop: 10,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  iconCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCardActive: {
    borderColor: Theme.colors.brand.primary,
    borderWidth: 2,
    backgroundColor: Theme.colors.brand.primary + "05",
  },
  iconCircleBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconCircleBigActive: {
    backgroundColor: Theme.colors.brand.primary + "15",
  },
  iconLabel: {
    fontSize: 14,
    fontFamily: Theme.typography.family.black,
    color: "#64748b",
  },
  iconLabelActive: {
    color: Theme.colors.brand.primary,
  },
  checkSeal: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  stageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 16,
  },
  stageButtonActive: {
    borderColor: Theme.colors.brand.primary,
    backgroundColor: Theme.colors.brand.primary + "05",
  },
  stageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  stageIconContainerActive: {
    backgroundColor: Theme.colors.brand.primary + "15",
  },
  stageText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Theme.typography.family.semibold,
    color: "#334155",
  },
  stageTextActive: {
    color: Theme.colors.brand.primary,
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
  },
  progressBarActive: {
    backgroundColor: Theme.colors.brand.primary,
  },
  content: {
    padding: 24,
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    color: "#475569",
    marginBottom: 32,
    lineHeight: 24,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  optionButtonActive: {
    backgroundColor: "rgba(79, 70, 229, 0.05)",
    borderColor: Theme.colors.brand.primary,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    color: Theme.colors.text.primary,
  },
  optionTextActive: {
    color: Theme.colors.brand.primary,
  },
  inputCard: {
    padding: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 20,
    height: 64,
  },
  input: {
    flex: 1,
    color: Theme.colors.text.primary,
    fontSize: 16,
    fontFamily: Theme.typography.family.medium,
  },
  textInput: {
    height: 64,
    paddingHorizontal: 20,
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
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
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
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
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
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
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    color: Theme.colors.text.primary,
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
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
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 8,
  },
  analysisSubtitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
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
    borderColor: "#e2e8f0",
  },
  skipContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    textDecorationLine: "underline",
  },
  estimateCard: {
    padding: 24,
    borderRadius: 32,
    alignItems: "center",
  },
  estimateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  estimateIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
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
    fontFamily: Theme.typography.family.bold,
    color: "#818cf8",
    textTransform: "uppercase",
  },
  estimateLabel: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  estimateValue: {
    fontSize: 40,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: "center",
  },
  estimateDisclaimer: {
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 16,
    opacity: 0.7,
  },
  estimateDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#f1f5f9",
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
    color: "#475569",
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
    fontFamily: Theme.typography.family.bold,
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
    fontFamily: Theme.typography.family.bold,
    color: "#10b981",
    textTransform: "uppercase",
  },
  privacyNote: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    marginTop: 24,
  },
  materialContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: 14,
    width: "100%",
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  materialHeaderText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  materialGrid: {
    gap: 8,
  },
  materialCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.04)",
  },
  materialIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  materialName: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  materialMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  brandTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
  },
  materialQuantity: {
    fontSize: 10,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    gap: 6,
    width: "100%",
  },
  activeViewDetailsBtn: {
    backgroundColor: Theme.colors.text.primary,
  },
  viewDetailsText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
  },
  activeViewDetailsText: {
    color: "white",
  },
});
