import React from "react";
import { router } from "expo-router";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import {
  ProjectDetailContent,
  projectDetailStyles,
  useProjectDetailData,
} from "@/features/project-detail";

import { AwarenessProvider } from "@/contexts/AwarenessProvider";

function ProjectDetailScreenInner() {
  const vm = useProjectDetailData();

  if (vm.loading) {
    return (
      <ScreenWrapper style={projectDetailStyles.centerContainer}>
        <SnurraLoader
          size={SnurraSize.screen}
          accessibilityLabel="Loading project"
        />
      </ScreenWrapper>
    );
  }

  if (!vm.id) {
    return (
      <ScreenWrapper style={projectDetailStyles.centerContainer}>
        <DataLoadErrorFullScreen
          message="This project link isn’t valid. Go back and open a project from your dashboard."
          onRetry={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  if (vm.projectLoadError && !vm.project) {
    return (
      <ScreenWrapper style={projectDetailStyles.centerContainer}>
        <DataLoadErrorFullScreen
          message={vm.projectLoadError}
          onRetry={() => void vm.handleRefresh()}
        />
      </ScreenWrapper>
    );
  }

  return (
    <AwarenessProvider
      project={vm.project}
      scopeItems={vm.scope}
      invoices={vm.detailInvoices}
      spendByCategory={vm.spendByCategory}
      isArchitect={vm.isArchitect}
      hasProjectPass={vm.hasProjectPass}
      galleryItems={vm.galleryItems}
    >
      <ProjectDetailContent {...vm} />
    </AwarenessProvider>
  );
}

export default function ProjectDetailScreen() {
  if (!isSupabaseConfigured()) {
    return (
      <ScreenWrapper>
        <ConfigurationRequired onRetry={() => router.replace("/(tabs)")} />
      </ScreenWrapper>
    );
  }
  return (
    <ComponentErrorBoundary name="Project Detail">
      <ProjectDetailScreenInner />
    </ComponentErrorBoundary>
  );
}
