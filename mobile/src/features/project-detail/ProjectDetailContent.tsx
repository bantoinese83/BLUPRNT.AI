import React from "react";
import { View } from "react-native";
import { DashboardLoadErrorBanner } from "@/components/DashboardLoadErrorBanner";
import { UpgradeModal } from "@/components/UpgradeModal";
import { AddScopeItemModal } from "@/components/AddScopeItemModal";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import { ProjectDetailInsightCards } from "./ProjectDetailInsightCards";
import { ProjectScopeGroupedList } from "./ProjectScopeGroupedList";
import { ProjectScopeEmptyState } from "./ProjectScopeEmptyState";
import { ProjectDetailFooterActions } from "./ProjectDetailFooterActions";
import { projectDetailStyles as styles } from "./project-detail.styles";
import type { ProjectDetailViewModel } from "./useProjectDetailData";

export function ProjectDetailContent(vm: ProjectDetailViewModel) {
  const {
    id,
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
    scopeLoadWarning,
    setScopeLoadWarning,
    groupedScope,
    handleShare,
    handleRefresh,
    exportSellerPacket,
  } = vm;

  const hasScopeRows = Object.keys(groupedScope).length > 0;

  return (
    <ScreenWrapper
      withScroll
      withTabBar={false}
      onRefresh={handleRefresh}
      refreshing={vm.loading}
      edges={["top", "bottom", "left", "right"]}
    >
      <ProjectDetailHeader
        title={project?.name}
        onShare={handleShare}
        onAddPress={() => setShowAddModal(true)}
      />

      {scopeLoadWarning ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <DashboardLoadErrorBanner
            message={scopeLoadWarning}
            onRetry={handleRefresh}
            onDismiss={() => setScopeLoadWarning(null)}
          />
        </View>
      ) : null}

      <View style={styles.content}>
        {project ? (
          <ProjectDetailInsightCards
            project={project}
            invoiceTotal={vm.invoiceTotal}
          />
        ) : null}

        {hasScopeRows ? (
          <ProjectScopeGroupedList
            groupedScope={groupedScope}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
          />
        ) : (
          <ProjectScopeEmptyState
            project={project}
            scopePollDone={scopePollDone}
            onRefresh={handleRefresh}
          />
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
          if (!id) return;
          await addItem(id, item);
          handleRefresh();
        }}
      />
    </ScreenWrapper>
  );
}
