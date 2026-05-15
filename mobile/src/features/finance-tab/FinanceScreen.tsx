import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { Receipt } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useDashboardData } from "@/hooks/useDashboardData";
import { LedgerEntryReviewSheet } from "@/components/LedgerEntryReviewSheet";
import type { LedgerEntryRow } from "@shared/types/database";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAwareness } from "@/contexts/AwarenessContext";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { FinanceTabSkeleton } from "@/components/TabLoadingSkeletons";
import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";
import { FinanceLedgerHeader } from "@/features/finance-tab/FinanceLedgerHeader";
import { AddAssetSheet } from "@/features/finance-tab/AddAssetSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useConfirmation } from "@/contexts/useConfirmation";
import { useFinanceLedger } from "@/features/finance-tab/hooks/useFinanceLedger";
import { LedgerListView } from "@/features/finance-tab/components/LedgerListView";
import { HomeSpecsView } from "@/features/finance-tab/components/HomeSpecsView";

export default function FinanceScreen() {
  const {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    configurationMissing,
    projects,
    projectSwitcherHints,
    project,
    scopeItems,
    ledgerEntries,
    handleProjectSelect,
    isArchitect,
    hasProjectPass,
    load,
  } = useDashboardData();

  const { setShowUpgrade, setUpgradeReason } = useAwareness();
  const { confirm } = useConfirmation();

  const {
    filter,
    setFilter,
    exporting,
    isUploading,
    includeAppendix,
    setIncludeAppendix,
    deletingId,
    stats,
    sections,
    handleExport,
    openLedgerDocumentCapture,
    handleDelete,
  } = useFinanceLedger({
    project,
    ledgerEntries,
    scopeItems,
    isArchitect,
    hasProjectPass,
    load,
    setShowUpgrade,
    setUpgradeReason,
  });

  const [selectedLedgerEntry, setSelectedLedgerEntry] =
    useState<LedgerEntryRow | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [originalPreviewLedgerEntryId, setOriginalPreviewLedgerEntryId] =
    useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"ledger" | "specs">("ledger");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  const onLedgerEntryDelete = useCallback(
    (id: string) => {
      confirm({
        title: "Remove document?",
        message:
          "This will permanently delete this record and its associated data.",
        confirmLabel: "Remove",
        variant: "destructive",
        onConfirm: async () => {
          await handleDelete(id);
        },
      });
    },
    [confirm, handleDelete],
  );

  const renderHeader = useCallback(
    () =>
      project ? (
        <View>
          <SegmentedControl
            options={[
              { label: "Financials", value: "ledger" },
              { label: "Home Specs", value: "specs" },
            ]}
            value={currentTab}
            onChange={(val) => {
              setCurrentTab(val as "ledger" | "specs");
              Haptics.selectionAsync();
            }}
            containerStyle={{ marginHorizontal: 24, marginTop: 16 }}
          />
          {currentTab === "ledger" && (
            <FinanceLedgerHeader
              loadError={loadError}
              onRetryLoad={() => void load()}
              onDismissLoadError={clearLoadError}
              projects={projects}
              projectSwitcherHints={projectSwitcherHints}
              project={project}
              onProjectSelect={handleProjectSelect}
              onPressAddDocument={() =>
                openLedgerDocumentCapture((entry) => {
                  setSelectedLedgerEntry(entry);
                  setIsReviewOpen(true);
                })
              }
              isUploading={isUploading}
              stats={stats}
              includeAppendix={includeAppendix}
              onIncludeAppendixChange={setIncludeAppendix}
              exporting={exporting}
              onExport={handleExport}
              ledgerEntries={ledgerEntries}
              filter={filter}
              onFilterChange={setFilter}
            />
          )}
        </View>
      ) : null,
    [
      project,
      currentTab,
      loadError,
      load,
      clearLoadError,
      projects,
      projectSwitcherHints,
      handleProjectSelect,
      openLedgerDocumentCapture,
      isUploading,
      stats,
      includeAppendix,
      setIncludeAppendix,
      exporting,
      handleExport,
      ledgerEntries,
      filter,
      setFilter,
    ],
  );

  if (configurationMissing) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ConfigurationRequired onRetry={() => void load()} />
      </ScreenWrapper>
    );
  }

  if (loading && !project) {
    return <FinanceTabSkeleton />;
  }

  if (loadError && !project && projects.length === 0) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <DataLoadErrorFullScreen
          message={loadError}
          onRetry={() => void load()}
        />
      </ScreenWrapper>
    );
  }

  if (!project) {
    return (
      <ScreenWrapper
        style={styles.centerContainer}
        withLogo
        withScroll
        onRefresh={load}
        refreshing={refreshing}
      >
        <EmptyState
          icon={Receipt}
          title="Your home hub is ready"
          description="Set up a renovation to track your vault, equity, and documents — same quick flow as the Home tab."
          actionTitle="Start your BLUPRNT"
          actionTitleCase="sentence"
          onAction={() => router.push("/onboarding?newProject=1")}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper withLogo edges={["top", "left", "right"]}>
      {currentTab === "ledger" ? (
        <LedgerListView
          sections={sections}
          refreshing={refreshing}
          onRefresh={load}
          renderHeader={renderHeader}
          isArchitect={isArchitect}
          hasProjectPass={hasProjectPass}
          deletingId={deletingId}
          onEntryPress={(entry) => {
            setSelectedLedgerEntry(entry);
            setIsReviewOpen(true);
          }}
          onViewOriginal={setOriginalPreviewLedgerEntryId}
          onDelete={onLedgerEntryDelete}
          onUpgradeClick={() => {
            setUpgradeReason("general");
            setShowUpgrade(true);
          }}
          onOpenCapture={() =>
            openLedgerDocumentCapture((entry) => {
              setSelectedLedgerEntry(entry);
              setIsReviewOpen(true);
            })
          }
          onResetFilter={() => setFilter("all")}
          ledgerEntriesCount={ledgerEntries.length}
        />
      ) : (
        <HomeSpecsView
          projectId={project.id}
          onAddAsset={() => setIsAddAssetOpen(true)}
        />
      )}

      <LedgerEntryReviewSheet
        ledgerEntry={selectedLedgerEntry}
        projectId={project?.id ?? null}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedLedgerEntry(null);
        }}
        onDeleted={load}
        onSaved={() => {
          void load();
        }}
      />

      {originalPreviewLedgerEntryId ? (
        <OriginalUploadPreviewModal
          key={originalPreviewLedgerEntryId}
          ledgerEntryId={originalPreviewLedgerEntryId}
          onClose={() => setOriginalPreviewLedgerEntryId(null)}
        />
      ) : null}

      <AddAssetSheet
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onSuccess={() => {
          setIsAddAssetOpen(false);
          load();
        }}
        projectId={project?.id ?? ""}
      />
    </ScreenWrapper>
  );
}
