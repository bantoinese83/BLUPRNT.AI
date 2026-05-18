import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Folder, ArrowRight, FolderOpen } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { DashboardLoadErrorBanner } from "@/components/DashboardLoadErrorBanner";
import { ProjectsTabSkeleton } from "@/components/TabLoadingSkeletons";
import { Theme } from "@/constants/Theme";

export default function ProjectsScreen() {
  const {
    projects,
    loading,
    refreshing,
    load,
    loadError,
    clearLoadError,
    configurationMissing,
    handleProjectSelect,
  } = useDashboardData();

  if (configurationMissing) {
    return (
      <ScreenWrapper withLogo style={{ flex: 1, justifyContent: "center" }}>
        <ConfigurationRequired onRetry={() => void load()} />
      </ScreenWrapper>
    );
  }

  if (loadError && !loading && projects.length === 0) {
    return (
      <ScreenWrapper withLogo style={{ flex: 1, justifyContent: "center" }}>
        <DataLoadErrorFullScreen
          message={loadError}
          onRetry={() => void load()}
        />
      </ScreenWrapper>
    );
  }

  if (loading && projects.length === 0) {
    return <ProjectsTabSkeleton />;
  }

  return (
    <ScreenWrapper withLogo withScroll onRefresh={load} refreshing={refreshing}>
      {loadError && projects.length > 0 ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <DashboardLoadErrorBanner
            message={loadError}
            onRetry={() => void load()}
            onDismiss={clearLoadError}
          />
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>Your Projects</Text>
        <Text style={styles.subtitle}>All home renovation estimates</Text>
      </View>

      <View style={styles.scrollContent}>
        {!loading && projects.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            title="No projects here yet"
            description="Add a renovation from the guided flow—photos, estimate, and line items—then it appears here."
            actionTitle="Add a project"
            onAction={() => router.push("/onboarding?newProject=1")}
          />
        )}
        {projects.map((p, idx) => (
          <MotiView
            key={p.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: idx * 50 }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                void handleProjectSelect(p.id);
                router.push(`/project/${p.id}`);
              }}
            >
              <GlassCard style={styles.projectCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Folder size={20} color={Theme.colors.brand.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.projectName}>{p.name}</Text>
                    <Text style={styles.projectMeta}>
                      {p.stage || "Planning"}
                    </Text>
                  </View>
                  <ArrowRight size={20} color={Theme.colors.text.secondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 24,
  },
  projectCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  projectMeta: {
    fontSize: 12,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
