import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import { ChevronLeft, ChevronRight, Check } from "lucide-react-native";
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

const STEPS = ["Type", "Location", "Stage", "Finish"];

export default function OnboardingScreen() {
  const { user, session } = useAuth();
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectTypeOption | null>(
    null,
  );
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<StageOption | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) {
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
      Alert.alert(
        "Sign In Required",
        "Please create an account to save your estimate.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Register", onPress: () => router.push("/(auth)/register") },
        ],
      );
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
        estimate: null,
        photos: [],
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
                placeholderTextColor="#64748b"
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
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -50 }}
            key="step3"
          >
            <Text style={styles.stepTitle}>Almost there</Text>
            <Text style={styles.stepSubtitle}>
              Confirm your details to generate your report.
            </Text>
            <GlassCard intensity={25} style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>{projectType}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location:</Text>
                <Text style={styles.reviewValue}>{location}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Stage:</Text>
                <Text style={styles.reviewValue}>{stage}</Text>
              </View>
            </GlassCard>
          </MotiView>
        );
      default:
        return null;
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
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
    backgroundColor: "rgba(79, 70, 229, 0.2)",
    borderColor: "#4f46e5",
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
});
