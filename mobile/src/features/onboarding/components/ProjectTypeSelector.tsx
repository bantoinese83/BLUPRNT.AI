import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { ProjectIcon } from "@/lib/project-icons";
import type { ProjectTypeOption } from "@/lib/onboarding-helpers";
import type { OnboardingStyles } from "@/features/onboarding/onboarding-step-types";

interface ProjectTypeSelectorProps {
  styles: OnboardingStyles;
  projectType: ProjectTypeOption | null;
  setProjectType: (type: ProjectTypeOption) => void;
}

const OPTIONS = [
  { name: "Kitchen" },
  { name: "Bathroom" },
  { name: "Painting" },
  { name: "Roof" },
  { name: "Flooring" },
  { name: "Something else" },
] as const;

export function ProjectTypeSelector({
  styles,
  projectType,
  setProjectType,
}: ProjectTypeSelectorProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      key="step0"
    >
      <Text style={styles.stepTitle}>What are you planning today?</Text>
      <Text style={styles.stepSubtitle}>You can add more projects later.</Text>
      <View style={styles.iconGrid}>
        {OPTIONS.map((opt) => (
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
}
