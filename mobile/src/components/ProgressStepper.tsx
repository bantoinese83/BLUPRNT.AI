import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Check } from "lucide-react-native";
import { Theme } from "@/constants/Theme";

const STAGES = [
  { id: "planning", label: "Plan" },
  { id: "collecting_quotes", label: "Quotes" },
  { id: "construction", label: "Work" },
  { id: "completed", label: "Done" },
];

export function ProgressStepper({
  currentStage,
}: {
  currentStage?: string | null;
}) {
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

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 12,
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
