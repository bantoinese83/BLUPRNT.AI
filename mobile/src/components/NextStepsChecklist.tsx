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
  LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { GlassCard } from "./ui/GlassCard";

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
        label: "Upload Quote",
        description: "Snap a photo of a contractor bid.",
        icon: Hammer,
      },
      {
        id: "export-packet",
        label: "Export Brief",
        description: "Get a PDF to share with pros.",
        icon: Share2,
      },
    );
  } else {
    steps.push(
      {
        id: "upload-invoice",
        label: "Track Invoice",
        description: "Start building your property ledger.",
        icon: FileText,
      },
      {
        id: "review-health",
        label: "Check Health",
        description: "See if you're staying within baseline.",
        icon: Hammer,
      },
      {
        id: "share-access",
        label: "Share Access",
        description: "Invite someone to view records.",
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
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 100 }}
          style={styles.stepWrapper}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onAction(step.id);
            }}
          >
            <GlassCard intensity={15} style={styles.stepCard}>
              <View style={styles.iconContainer}>
                <step.icon size={20} color="#818cf8" />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.label}>{step.label}</Text>
                  <ArrowRight size={12} color="#4f46e5" />
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
    paddingRight: 40, // Extra breathing room at the end
    gap: 16, // Increased gap for premium feel
  },
  stepWrapper: {
    width: 220,
  },
  stepCard: {
    padding: 16,
    height: 140,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(129, 140, 248, 0.1)",
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
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  description: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    lineHeight: 16,
  },
});
