import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { ProjectIcon } from "@/lib/project-icons";
import { Theme } from "@/constants/Theme";
import type { StageOption } from "@/lib/onboarding-helpers";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";

interface StageSelectorProps {
  styles: OnboardingStyles;
  stage: StageOption | null;
  setStage: (stage: StageOption) => void;
}

const STAGES = [
  {
    name: "Just planning" as const,
    description: "Exploring possibilities and getting a rough idea of costs.",
  },
  {
    name: "Collecting quotes" as const,
    description: "Actively talking to contractors and comparing estimates.",
  },
  {
    name: "Already started work" as const,
    description: "Managing an ongoing project and tracking expenses.",
  },
] as const;

export function StageSelector({ styles, stage, setStage }: StageSelectorProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      key="step2"
    >
      <Text style={styles.stepTitle}>Where are you in the process?</Text>
      <View style={{ gap: 12, marginTop: 20 }}>
        {STAGES.map((s) => (
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
}
