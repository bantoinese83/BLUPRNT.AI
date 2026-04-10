import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  Package,
  Boxes,
  Tag,
  ChevronDown,
  ChevronUp,
  Layers,
  MapPin,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { money } from "../../shared/lib/formatters";
import { compressImageForAnalysis } from "../src/lib/image-utils";
import { GlassCard } from "../src/components/ui/GlassCard";
import { Button } from "../src/components/ui/Button";
import { SnurraLoader, SnurraSize } from "../src/components/ui/SnurraLoader";
import { ScreenWrapper } from "../src/components/ScreenWrapper";
import {
  ProjectTypeOption,
  StageOption,
  saveOnboardingProject,
  projectTypeToRoomType,
  PhotoToScopeResult,
  DEFAULT_ESTIMATE_CONFIDENCE,
  ONBOARDING_SESSION_INVALID,
  normalizeStageFromDraft,
  type ScopeItem,
} from "../src/lib/onboarding-helpers";
import {
  persistOnboardingDraft,
  loadOnboardingDraft,
  clearOnboardingDraft,
} from "../src/lib/onboarding-draft";
import { ProjectIcon } from "../src/lib/project-icons";
import { Image as ExpoImage } from "expo-image";
import galleryAsset from "../assets/onboarding/gallery.svg";
import cameraAsset from "../assets/onboarding/camera.svg";
import { supabase, invokeFunction } from "../src/lib/supabase";
import { useAuth } from "../src/contexts/auth-context";
import { Theme } from "../src/constants/Theme";
import { getRangeForType } from "../src/constants/estimateRanges";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveZipFromCurrentLocation } from "../src/lib/zip-from-location";

/** Seven internal steps; progress UI is grouped into three phases below. */
const ONBOARDING_LAST_STEP_INDEX = 6;

const ONBOARDING_PHASES = [
  { label: "About project" },
  { label: "Your estimate" },
  { label: "Save" },
] as const;

function phaseIndexForStep(step: number): number {
  if (step <= 3) return 0;
  if (step <= 5) return 1;
  return 2;
}

function hasValidOnboardingZip(locationInput: string): boolean {
  return /^\d{5}$/.test(locationInput.trim());
}

function onboardingZipCode(locationInput: string): string {
  const digits = locationInput.replace(/\D/g, "").slice(0, 5);
  return hasValidOnboardingZip(locationInput) ? locationInput.trim() : digits;
}

/** Matches web `LoadingScreen` status copy (rotating lines under the loader). */
function loadingScreenMessages(
  projectType: ProjectTypeOption | null,
  locationInput: string,
): string[] {
  const kind =
    projectType === "Kitchen"
      ? "kitchen"
      : projectType === "Bathroom"
        ? "bathroom"
        : "project";
  const zipLabel = hasValidOnboardingZip(locationInput)
    ? locationInput.trim()
    : "";
  return [
    `Building your ${kind} estimate...`,
    zipLabel
      ? `Pulling typical costs near ${zipLabel}...`
      : "Checking what remodels cost near you...",
    `Matching materials people actually use on ${kind} jobs...`,
    "Layering in labor for your area...",
    "Almost there—tidying the numbers...",
  ];
}

/** Line-item costs from AI scope — always shown when the user opens “Breakdown”. */
function ScopeEstimateBreakdown({ items }: { items: ScopeItem[] }) {
  if (!items?.length) return null;

  return (
    <View style={styles.scopeBreakdownContainer}>
      <View style={styles.materialHeader}>
        <Layers size={12} color={Theme.colors.brand.primary} />
        <Text style={styles.materialHeaderText}>Cost breakdown</Text>
      </View>
      <View style={styles.scopeLineList}>
        {items.map((item, idx) => (
          <View
            key={`${item.category}-${idx}`}
            style={[
              styles.scopeLineCard,
              idx < items.length - 1 && styles.scopeLineCardBorder,
            ]}
          >
            <View style={styles.scopeLineTextCol}>
              <Text style={styles.scopeLineCategory}>{item.category}</Text>
              {item.description ? (
                <Text style={styles.scopeLineDesc}>{item.description}</Text>
              ) : null}
              <Text style={styles.scopeLineMeta}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <Text style={styles.scopeLineCost}>
              {money(item.total_cost_min, item.total_cost_max)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

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
  const insets = useSafeAreaInsets();
  const { user, session, signOut } = useAuth();
  const { newProject: newProjectParam, restoreOnboarding } =
    useLocalSearchParams<{
      newProject?: string;
      restoreOnboarding?: string;
    }>();
  /** From Add tab / “new project” CTAs — skip fast-track so existing users can add another project. */
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
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [analysisBarW, setAnalysisBarW] = useState(0);
  const [estimate, setEstimate] = useState<{
    min: number;
    max: number;
    scope: PhotoToScopeResult["scope_items"];
    confidence: number;
  } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [locatingZip, setLocatingZip] = useState(false);

  /** Step 4: ignore late analysis results if the user left analysis. */
  const analysisStepActiveRef = React.useRef(false);

  const handleFillZipFromLocation = React.useCallback(async () => {
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

  const analysisMessages = useMemo(
    () => loadingScreenMessages(projectType, location),
    [projectType, location],
  );

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

  const runAnalysis = React.useCallback(async () => {
    try {
      if (photos.length === 0 && !scopeDescription?.trim()) {
        if (!analysisStepActiveRef.current) return;
        const range = getRangeForType(projectType);
        setEstimate({
          min: range.min,
          max: range.max,
          scope: [],
          confidence: DEFAULT_ESTIMATE_CONFIDENCE,
        });
        setStep(5);
        return;
      }

      const fd = new FormData();
      const zip = onboardingZipCode(location) || "00000";

      fd.append("zip_code", zip);
      fd.append("room_type", projectTypeToRoomType(projectType));
      fd.append("finish_preference", "mid");

      if (scopeDescription?.trim()) {
        fd.append("scope_description", scopeDescription.trim());
      }

      const compressedUris = await Promise.all(
        photos.map((uri) => compressImageForAnalysis(uri)),
      );

      compressedUris.forEach((uri, index) => {
        // @ts-expect-error: React Native FormData needs this object format
        fd.append("photos[]", {
          uri,
          name: `vision_asset_${index}.jpg`,
          type: "image/jpeg",
        });
      });

      const { data, error } = await invokeFunction<PhotoToScopeResult>(
        "photo-to-scope",
        { body: fd },
      );

      if (error || !data) {
        throw new Error(
          error && "message" in error
            ? String((error as { message: string }).message)
            : "AI Analysis failed",
        );
      }

      const result = data;
      if (!analysisStepActiveRef.current) return;
      setEstimate({
        min: result.summary.estimated_min_total,
        max: result.summary.estimated_max_total,
        scope: result.scope_items,
        confidence: Number.isFinite(result.summary.confidence_score)
          ? result.summary.confidence_score
          : DEFAULT_ESTIMATE_CONFIDENCE,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(5);
    } catch (err) {
      if (__DEV__) {
        console.warn("Onboarding analysis used fallback:", err);
      }
      if (!analysisStepActiveRef.current) return;
      // Fallback to a type-based range if AI fails, but mark it clearly
      const range = getRangeForType(projectType);
      setEstimate({
        min: range.min,
        max: range.max,
        scope: [],
        confidence: DEFAULT_ESTIMATE_CONFIDENCE,
      });
      setStep(5);
      Alert.alert(
        "Regional Estimation",
        "We couldn't perform a deep vision analysis on these photos, so we've provided a refined regional estimate based on your project type.",
      );
    }
  }, [location, projectType, scopeDescription, photos]);

  const runAnalysisRef = React.useRef(runAnalysis);
  runAnalysisRef.current = runAnalysis;

  useEffect(() => {
    if (isAddingAnotherProject || !user?.id) return;

    let cancelled = false;
    void (async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_user_id", user.id);

      const propIds = (props || []).map((p) => p.id);
      if (propIds.length === 0) return;

      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("property_id", propIds);

      if (cancelled) return;
      if (!error && count && count > 0) {
        router.replace("/(tabs)");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isAddingAnotherProject]);

  useEffect(() => {
    if (isAddingAnotherProject) {
      void clearOnboardingDraft();
    }
  }, [isAddingAnotherProject]);

  useEffect(() => {
    if (restoreOnboarding !== "1" || !session?.user?.id) return;

    let cancelled = false;
    void (async () => {
      const draft = await loadOnboardingDraft();
      if (cancelled || !draft) return;
      setProjectType(draft.projectType);
      setLocation(draft.location);
      setStage(normalizeStageFromDraft(String(draft.stage ?? "")));
      setPhotos(draft.photos);
      setScopeDescription(draft.scopeDescription);
      setEstimate(
        draft.estimate
          ? {
              min: draft.estimate.min,
              max: draft.estimate.max,
              scope: draft.estimate.scope,
              confidence: draft.estimate.confidence,
            }
          : null,
      );
      setStep(6);
      await clearOnboardingDraft();
    })();

    return () => {
      cancelled = true;
    };
  }, [restoreOnboarding, session?.user?.id]);

  useEffect(() => {
    if (step !== 4) return;

    analysisStepActiveRef.current = true;
    setAnalysisIndex(0);
    let current = 0;
    const messageInterval = setInterval(() => {
      current = (current + 1) % analysisMessages.length;
      setAnalysisIndex(current);
    }, 2500);

    void runAnalysisRef.current();

    return () => {
      analysisStepActiveRef.current = false;
      clearInterval(messageInterval);
    };
  }, [step, analysisMessages.length]);

  const analysisBarTargetW = analysisBarW > 0 ? analysisBarW : 280;

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
                confidence_score: estimate.confidence,
              },
              // Pass full AI-generated scope so BOM is persisted to DB
              scope_items: estimate.scope ?? [],
            }
          : null,
        photos: photos.map((p) => ({ uri: p })),
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
          "We couldn’t verify your account on the server. If your profile was reset or removed, sign in again—then you can finish saving your project.",
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
                    void handleFillZipFromLocation();
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
              Add at least one photo or a short description so we can tailor
              your estimate.
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
              onLayout={(e) => setAnalysisBarW(e.nativeEvent.layout.width)}
            >
              <MotiView
                key={Math.round(analysisBarTargetW)}
                style={[
                  styles.analysisProgressFill,
                  { width: analysisBarTargetW * 0.02 },
                ]}
                from={{ width: analysisBarTargetW * 0.02 }}
                animate={{ width: analysisBarTargetW * 0.92 }}
                transition={{ type: "timing", duration: 20_000 }}
              />
            </View>
            <Text style={styles.analysisFooterMicro}>
              Scanning Database Assets
            </Text>
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
                  <Text style={styles.breakdownText}>
                    Typical labor near you
                  </Text>
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
      withScroll={false}
      withTabBar={false}
      withKeyboard
      edges={["top", "bottom", "left", "right"]}
    >
      <StatusBar style="dark" />
      <View style={styles.screenColumn}>
        <View style={styles.header}>
          <View style={styles.headerNavRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressContainer}>
              {ONBOARDING_PHASES.map((_, i) => {
                const phaseNow = phaseIndexForStep(step);
                return (
                  <View
                    key={i}
                    style={[
                      styles.progressBar,
                      { flex: 1 },
                      i > 0 && { marginLeft: 8 },
                      i <= phaseNow && styles.progressBarActive,
                    ]}
                  />
                );
              })}
            </View>
            <Text style={styles.phaseLabel} numberOfLines={1}>
              {ONBOARDING_PHASES[phaseIndexForStep(step)].label}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.stepScroll}
          contentContainerStyle={styles.stepScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatePresence exitBeforeEnter>{renderStep()}</AnimatePresence>
        </ScrollView>

        {step < ONBOARDING_LAST_STEP_INDEX && step !== 4 && (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
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
              icon={<ChevronRight size={20} color="white" />}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenColumn: {
    flex: 1,
  },
  stepScroll: {
    flex: 1,
  },
  stepScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  headerNavRow: {
    flexDirection: "row",
    alignItems: "center",
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
  stageDescription: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  progressSection: {
    marginTop: 16,
    width: "100%",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phaseLabel: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
  },
  progressBarActive: {
    backgroundColor: Theme.colors.brand.primary,
  },
  step5Column: {
    width: "100%",
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
    backgroundColor: "rgba(13, 148, 136, 0.05)",
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
  zipInputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  zipTextInput: {
    flex: 1,
    minHeight: 64,
    paddingLeft: 20,
    paddingRight: 8,
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: 2,
  },
  zipLocateButton: {
    width: 52,
    height: 52,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  zipLocateButtonDisabled: {
    opacity: 0.65,
  },
  zipLocateHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15, 23, 42, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
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
  visionHint: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    marginTop: 4,
  },
  visionAsset: {
    width: 32,
    height: 32,
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
  analysisStepRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 28,
    width: "100%",
  },
  analysisLoaderCluster: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: SnurraSize.hero + 24,
    marginBottom: 8,
  },
  analysisLoaderGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(13, 148, 136, 0.07)",
  },
  analysisTitle: {
    fontSize: 26,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  analysisLeadSubtitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  analysisSubtitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.medium,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  analysisMessageWrap: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  analysisProgressTrack: {
    position: "relative",
    marginTop: 20,
    width: "72%",
    maxWidth: 280,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  analysisProgressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: Theme.colors.brand.primary,
    shadowColor: "rgba(13, 148, 136, 0.45)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 2,
  },
  analysisFooterMicro: {
    marginTop: 12,
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
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
    alignItems: "stretch",
    width: "100%",
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
    color: "#2dd4bf",
    textTransform: "uppercase",
  },
  estimateLabel: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: "#14b8a6",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
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
    alignSelf: "stretch",
    gap: 12,
  },
  breakdownExpand: {
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
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
  scopeBreakdownContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: 14,
  },
  scopeLineList: {
    gap: 0,
  },
  scopeLineCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
  scopeLineCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.06)",
  },
  scopeLineTextCol: {
    flex: 1,
    minWidth: 0,
  },
  scopeLineCategory: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  scopeLineDesc: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  scopeLineMeta: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    marginTop: 6,
  },
  scopeLineCost: {
    fontSize: 13,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginTop: 2,
    flexShrink: 0,
    marginLeft: 8,
    minWidth: 108,
    textAlign: "right",
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
    backgroundColor: "#134e4a",
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
