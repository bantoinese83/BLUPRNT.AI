import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, type ScrollView } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { router } from "expo-router";
import { DashboardLoadErrorBanner } from "@/components/DashboardLoadErrorBanner";
import { UpgradeModal } from "@/components/UpgradeModal";
import { AddScopeItemModal } from "@/components/AddScopeItemModal";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import { TransformationVault } from "@/components/dashboard/TransformationVault";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import { ProjectDetailInsightCards } from "./ProjectDetailInsightCards";
import { ProjectScopeGroupedList } from "./ProjectScopeGroupedList";
import { ProjectScopeEmptyState } from "./ProjectScopeEmptyState";
import { ProjectDetailFooterActions } from "./ProjectDetailFooterActions";
import { projectDetailStyles as styles } from "./project-detail.styles";
import type { ProjectDetailViewModel } from "./useProjectDetailData";

export function ProjectDetailContent(vm: ProjectDetailViewModel) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [preScopeBlockHeight, setPreScopeBlockHeight] = useState(0);
  const didScrollToScopeRef = useRef(false);

  const onPreScopeBlockLayout = useCallback((e: LayoutChangeEvent) => {
    setPreScopeBlockHeight(e.nativeEvent.layout.height);
  }, []);

  const {
    id,
    scrollFocus,
    project,
    expandedId,
    setExpandedId,
    detailInvoices,
    includeAppendix,
    setIncludeAppendix,
    addItem,
    showUpgrade,
    setShowUpgrade,
    showAddModal,
    setShowAddModal,
    scopePollDone,
    detailDataWarning,
    clearDetailDataWarnings,
    groupedScope,
    handleShare,
    handleRefresh,
    exportSellerPacket,
    updateScopeItemMaterials,
  } = vm;

  const hasScopeRows = Object.keys(groupedScope).length > 0;

  useEffect(() => {
    didScrollToScopeRef.current = false;
  }, [scrollFocus, id]);

  useEffect(() => {
    if (scrollFocus !== "scope" || preScopeBlockHeight < 1) return;
    if (didScrollToScopeRef.current) return;
    didScrollToScopeRef.current = true;
    const t = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, preScopeBlockHeight - 12),
        animated: true,
      });
    }, 120);
    return () => clearTimeout(t);
  }, [scrollFocus, preScopeBlockHeight, scopePollDone, hasScopeRows]);

  const isTrustHighPriority =
    project?.stage === "planning" ||
    project?.stage === "collecting_quotes" ||
    !project?.stage;

  return (
    <ScreenWrapper
      withScroll
      scrollViewRef={scrollViewRef}
      withTabBar={false}
      onRefresh={handleRefresh}
      refreshing={vm.refreshing}
      edges={["top", "bottom", "left", "right"]}
    >
      <View onLayout={onPreScopeBlockLayout}>
        <ProjectDetailHeader
          title={project?.name}
          onShare={handleShare}
          onAddPress={() => setShowAddModal(true)}
          stage={project?.stage}
        />

        <View style={{ marginTop: 4, marginBottom: 16 }}>
          <ProjectSwitcher
            projects={vm.projects}
            currentId={id ?? ""}
            onSelect={(newId) => {
              vm.handleProjectSelect(newId);
              router.setParams({ id: newId });
            }}
            onAdd={() => router.push("/onboarding?newProject=1")}
          />
        </View>

        {detailDataWarning ? (
          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <DashboardLoadErrorBanner
              message={detailDataWarning}
              onRetry={handleRefresh}
              onDismiss={clearDetailDataWarnings}
            />
          </View>
        ) : null}

        {project ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 0, gap: 16 }}>
            <TransformationVault projectId={project.id} />
            <ProjectDetailInsightCards
              project={project}
              invoiceTotal={vm.invoiceTotal}
            />
            {isTrustHighPriority && (
              <GroundingSourcesSection project={project} />
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        {hasScopeRows ? (
          <ProjectScopeGroupedList
            groupedScope={groupedScope}
            reconciliation={vm.reconciliation}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onPersistScopeMaterials={updateScopeItemMaterials}
          />
        ) : (
          <ProjectScopeEmptyState
            project={project}
            scopePollDone={scopePollDone}
            onRefresh={handleRefresh}
          />
        )}

        {!isTrustHighPriority && project && (
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <GroundingSourcesSection project={project} />
          </View>
        )}

        <ProjectDetailFooterActions
          detailInvoices={detailInvoices}
          includeAppendix={includeAppendix}
          setIncludeAppendix={setIncludeAppendix}
          onShare={handleShare}
          onExportSellerPacket={exportSellerPacket}
        />
      </View>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="export"
      />

      <AddScopeItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (item) => {
          if (!id) {
            throw new Error("Missing project");
          }
          await addItem(id, item);
          handleRefresh();
        }}
      />
    </ScreenWrapper>
  );
}
