import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, Share2, Plus, Check } from "lucide-react-native";
import { Theme } from "@/constants/Theme";

type Props = {
  title?: string;
  onShare: () => void;
  onAddPress: () => void;
  stage?: string | null;
};

const STAGES = [
  { id: "planning", label: "Plan" },
  { id: "collecting_quotes", label: "Quotes" },
  { id: "construction", label: "Work" },
  { id: "completed", label: "Done" },
];

function ProgressStepper({ currentStage }: { currentStage?: string | null }) {
  const activeIndex = STAGES.findIndex((s) => s.id === currentStage);
  const normalizedIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <View style={styles.stepperContainer}>
      {STAGES.map((s, idx) => {
        const isPast = idx < normalizedIndex;
        const isActive = idx === normalizedIndex;
        return (
          <View key={s.id} style={styles.stepWrapper}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.dot,
                  isPast && styles.dotPast,
                  isActive && styles.dotActive,
                ]}
              >
                {isPast && <Check size={8} color="white" strokeWidth={3} />}
              </View>
              {idx < STAGES.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    idx < normalizedIndex && styles.connectorPast,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isActive || isPast) && styles.stepLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProjectDetailHeader({
  title,
  onShare,
  onAddPress,
  stage,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || "Project Details"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onShare}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Share project"
          >
            <Share2 size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.addBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddPress();
            }}
            accessibilityRole="button"
            accessibilityLabel="Add item"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ProgressStepper currentStage={stage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  addBtn: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: Theme.colors.brand.deep,
  },
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  stepWrapper: {
    alignItems: "center",
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.border,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: Theme.colors.brand.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: "white",
    transform: [{ scale: 1.1 }],
  },
  dotPast: {
    backgroundColor: Theme.colors.brand.primary,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Theme.colors.border,
    marginHorizontal: -2,
    zIndex: 1,
  },
  connectorPast: {
    backgroundColor: Theme.colors.brand.primary,
  },
  stepLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.disabled,
    textTransform: "uppercase",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  stepLabelActive: {
    color: Theme.colors.text.primary,
  },
});
