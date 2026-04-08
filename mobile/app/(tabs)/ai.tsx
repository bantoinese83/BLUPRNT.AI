import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { AIAssistant } from "../../src/components/AIAssistant";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Theme } from "../../src/constants/Theme";
import { ConfigurationRequired } from "../../src/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "../../src/components/DataLoadErrorFullScreen";

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
          <Text style={styles.emptyText}>
            {loading
              ? "Loading project..."
              : loadError
                ? loadError
                : "Create a project to start chatting with your AI assistant."}
          </Text>
          {!loading && !loadError ? (
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push("/onboarding?newProject=1")}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>Start a project</Text>
            </TouchableOpacity>
          ) : null}
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
    backgroundColor: "transparent",
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
  assistantContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyCta: {
    marginTop: 20,
    backgroundColor: Theme.colors.text.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
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
