import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { AIAssistant } from "../../src/components/AIAssistant";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Theme } from "../../src/constants/Theme";

export default function AIScreen() {
  const { project, loading } = useDashboardData();

  return (
    <ScreenWrapper withLogo>
      <View style={styles.header}>
        <Text style={styles.title}>Project Assistant</Text>
        <Text style={styles.subtitle}>
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
              : "Create a project to start chatting with your AI assistant."}
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: Theme.colors.divider,
    backgroundColor: "white",
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 4,
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
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
});
