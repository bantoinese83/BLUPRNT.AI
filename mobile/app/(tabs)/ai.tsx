import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { router } from "expo-router";
import { Zap } from "lucide-react-native";
import { AIAssistant } from "@/components/AIAssistant";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";
import { TAB_BAR_SCROLL_PADDING } from "@/constants/Layout";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";

export default function AIScreen() {
  const { project, loading, projects, load, loadError, configurationMissing } =
    useDashboardData();

  if (configurationMissing) {
    return (
      <ScreenWrapper withLogo edges={["top", "left", "right"]}>
        <ConfigurationRequired onRetry={() => void load()} />
      </ScreenWrapper>
    );
  }

  if (loadError && !project && projects.length === 0 && !loading) {
    return (
      <ScreenWrapper withLogo edges={["top", "left", "right"]}>
        <DataLoadErrorFullScreen
          message={loadError}
          onRetry={() => void load()}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper withLogo edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Assistant</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {project ? `Chatting about ${project.name}` : "AI Guidance"}
        </Text>
      </View>

      {project ? (
        <View style={styles.assistantContainer}>
          <AIAssistant projectId={project.id} />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Loading project...</Text>
          ) : (
            <EmptyState
              icon={Zap}
              title="Project Assistant"
              description={
                loadError ||
                "Create a project to start chatting with your AI assistant."
              }
              actionTitle="Start a project"
              actionTitleCase="sentence"
              onAction={() => router.push("/onboarding?newProject=1")}
            />
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.size.display,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 6,
    lineHeight: 20,
  },
  /**
   * Reserve tab bar + FAB below the assistant. Solid fill so the global
   * gradient never shows through this strip (reads as “grey dead space”).
   */
  assistantContainer: {
    flex: 1,
    paddingBottom: TAB_BAR_SCROLL_PADDING,
    backgroundColor: Theme.colors.card,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyCta: {
    marginTop: 20,
    backgroundColor: Theme.colors.brand.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    ...Theme.shadows.brand,
  },
  emptyCtaText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
  },
  emptyText: {
    color: Theme.colors.text.muted,
    textAlign: "center",
    fontFamily: Theme.typography.family.regular,
    fontSize: Theme.typography.size.lg,
    lineHeight: 24,
  },
});
