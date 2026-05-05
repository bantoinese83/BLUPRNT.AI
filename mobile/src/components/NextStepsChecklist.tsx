import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  ArrowRight,
  FileText,
  Hammer,
  Share2,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";

type Step = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

interface Props {
  stage: string;
  onAction: (id: string) => void;
}

export function NextStepsChecklist({ stage, onAction }: Props) {
  const steps: Step[] = [];

  if (stage === "planning") {
    steps.push(
      {
        id: "review-scope",
        label: "Review AI Scope",
        description: "Fine-tune your line items and quantities.",
        icon: FileText,
      },
      {
        id: "upload-quote",
        label: "Upload first quote",
        description: "Snap a photo of a contractor bid to compare.",
        icon: Hammer,
      },
      {
        id: "export-packet",
        label: "Export seller packet",
        description:
          "Download the full ledger PDF—scope, plan vs spend, and costs.",
        icon: Share2,
      },
    );
  } else {
    steps.push(
      {
        id: "upload-document",
        label: "Track an invoice",
        description: "Start building your property ledger.",
        icon: FileText,
      },
      {
        id: "review-health",
        label: "Check project health",
        description: "See if you're staying within your baseline.",
        icon: Hammer,
      },
      {
        id: "share-access",
        label: "Share with partner",
        description: "Invite someone to view the project records.",
        icon: Share2,
      },
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {steps.map((step, i) => (
        <MotiView
          key={step.id}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: i * 100 }}
          style={styles.stepWrapper}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onAction(step.id);
            }}
          >
            <GlassCard intensity={10} style={styles.stepCard}>
              <View style={styles.iconContainer}>
                <step.icon size={18} color={Theme.colors.brand.primary} />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.label}>{step.label}</Text>
                  <ArrowRight size={14} color={Theme.colors.brand.primary} />
                </View>
                <Text style={styles.description} numberOfLines={2}>
                  {step.description}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </MotiView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -24,
    marginBottom: 24,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingRight: 40,
    gap: 16,
  },
  stepWrapper: {
    width: 200,
  },
  stepCard: {
    padding: 18,
    height: 140,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  description: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 16,
  },
});
