import React from "react";
import { router } from "expo-router";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  ProjectDetailContent,
  projectDetailStyles,
  useProjectDetailData,
} from "@/features/project-detail";

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

  return <ProjectDetailContent {...vm} />;
}

export default function ProjectDetailScreen() {
  if (!isSupabaseConfigured()) {
    return (
      <ScreenWrapper>
        <ConfigurationRequired onRetry={() => router.replace("/(tabs)")} />
      </ScreenWrapper>
    );
  }
  return <ProjectDetailScreenInner />;
}
