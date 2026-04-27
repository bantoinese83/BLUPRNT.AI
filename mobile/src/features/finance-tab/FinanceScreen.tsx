import React, { useMemo, useState, useCallback } from "react";
import { View, Text, Alert, SectionList, TouchableOpacity } from "react-native";
import { Receipt, Plus } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useDashboardData } from "@/hooks/useDashboardData";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { LedgerEntryReviewSheet } from "@/components/LedgerEntryReviewSheet";
import type { LedgerEntryRow } from "@shared/types/database";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAwareness } from "@/contexts/AwarenessContext";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { FinanceTabSkeleton } from "@/components/TabLoadingSkeletons";
import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import { isFreeTierLedgerEntryLimitReached } from "@/lib/ledger-entry-upload-gate";
import {
  DOCUMENT_CAPTURE_LEDGER_COPY,
  presentDocumentCapturePrompt,
} from "@/lib/present-document-capture";
import { uploadPickedDocumentToProject } from "@/lib/upload-picked-document";
import { FINANCE_TAB_BAR_OFFSET } from "@/features/finance-tab/constants";
import {
  computeLedgerStats,
  sortLedgerEntriesByDateDesc,
  groupLedgerEntriesByMonth,
  groupedLedgerEntriesToSections,
  scopeRowsForSellerPacket,
  type LedgerDocumentFilter,
} from "@/features/finance-tab/ledger-helpers";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";
import { reportClientError } from "@/lib/sentry";
import { supabase } from "@/lib/supabase";
import { FinanceLedgerHeader } from "@/features/finance-tab/FinanceLedgerHeader";
import { FinanceLedgerEntryRow } from "@/features/finance-tab/FinanceLedgerEntryRow";
import { HomeSpecsTab } from "@/features/finance-tab/HomeSpecsTab";
import { AddAssetSheet } from "@/features/finance-tab/AddAssetSheet";
import { Theme } from "@/constants/Theme";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export default function FinanceScreen() {
  const {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    configurationMissing,
    projects,
    project,
    scopeItems,
    ledgerEntries,
    handleProjectSelect,
    isArchitect,
    hasProjectPass,
    load,
  } = useDashboardData();

  const { setShowUpgrade, setUpgradeReason } = useAwareness();

  const [filter, setFilter] = useState<LedgerDocumentFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [selectedLedgerEntry, setSelectedLedgerEntry] =
    useState<LedgerEntryRow | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [originalPreviewLedgerEntryId, setOriginalPreviewLedgerEntryId] =
    useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"ledger" | "specs">("ledger");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(
    () => computeLedgerStats(ledgerEntries as any),
    [ledgerEntries],
  );

  const sortedLedgerEntries = useMemo(
    () => sortLedgerEntriesByDateDesc(ledgerEntries as any),
    [ledgerEntries],
  );

  const scopeForSellerPacket = useMemo(
    () => scopeRowsForSellerPacket(scopeItems),
    [scopeItems],
  );

  const groupedLedgerEntries = useMemo(
    () => groupLedgerEntriesByMonth(sortedLedgerEntries, filter),
    [sortedLedgerEntries, filter],
  );

  const sections = useMemo(
    () => groupedLedgerEntriesToSections(groupedLedgerEntries),
    [groupedLedgerEntries],
  );

  const handleExport = useCallback(async () => {
    if (!project) return;

    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }

    if (scopeForSellerPacket.length === 0 && ledgerEntries.length === 0) {
      Alert.alert(
        "Nothing to export yet",
        "Add a scope item or upload a document, then try Export Home Archive again.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);

    try {
      await generateSellerPacketPDF(
        {
          id: project.id,
          property_id: project.property_id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeForSellerPacket,
        ledgerEntries as any,
        { includeAppendix },
      );
    } catch (err: unknown) {
      reportClientError("finance_seller_packet_pdf", err);
      Alert.alert(
        "Export Failed",
        "We couldn't generate the PDF. Please check your connection.",
      );
    } finally {
      setExporting(false);
    }
  }, [
    project,
    isArchitect,
    hasProjectPass,
    scopeForSellerPacket,
    ledgerEntries,
    includeAppendix,
    setUpgradeReason,
    setShowUpgrade,
  ]);

  const runLedgerDocumentUpload = useCallback(
    async (files: Array<{ uri: string; mimeType?: string }>) => {
      if (!project) return;

      setIsUploading(true);
      try {
        const result = await uploadPickedDocumentToProject({
          projectId: project.id,
          files,
          successToastMessage: "Document added — your vault is updated.",
          onLedgerEntryLimitUpgrade: () => {
            setUpgradeReason("ledger_limit");
            setShowUpgrade(true);
          },
          refreshProjectData: load,
        });
        if (result.ok && result.lastLedgerEntryId && files.length === 1) {
          const { data: row } = await supabase
            .from("ledger_entries")
            .select("*")
            .eq("id", result.lastLedgerEntryId)
            .maybeSingle();
          if (row) {
            setSelectedLedgerEntry(row as unknown as LedgerEntryRow);
            setIsReviewOpen(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [project, load, setUpgradeReason, setShowUpgrade],
  );

  const openLedgerDocumentCapture = useCallback(() => {
    Haptics.selectionAsync();

    if (
      isFreeTierLedgerEntryLimitReached(
        ledgerEntries as any,
        isArchitect,
        hasProjectPass,
      )
    ) {
      setUpgradeReason("ledger_limit");
      setShowUpgrade(true);
      return;
    }

    presentDocumentCapturePrompt(DOCUMENT_CAPTURE_LEDGER_COPY, (files) => {
      void runLedgerDocumentUpload(files);
    });
  }, [
    ledgerEntries,
    isArchitect,
    hasProjectPass,
    runLedgerDocumentUpload,
    setUpgradeReason,
    setShowUpgrade,
  ]);

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
              project={project}
              onProjectSelect={handleProjectSelect}
              onPressAddDocument={
                currentTab === "ledger"
                  ? openLedgerDocumentCapture
                  : () => setIsAddAssetOpen(true)
              }
              isUploading={isUploading}
              stats={stats}
              includeAppendix={includeAppendix}
              onIncludeAppendixChange={setIncludeAppendix}
              exporting={exporting}
              onExport={handleExport}
              ledgerEntries={ledgerEntries as any}
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

  const handleLedgerEntryDelete = (id: string) => {
    Alert.alert(
      "Remove document?",
      "This will permanently delete this record and its associated data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              const { error } = await supabase
                .from("ledger_entries")
                .delete()
                .eq("id", id);
              if (error) {
                Alert.alert(
                  "Couldn't remove",
                  "Something went wrong. Try again.",
                );
              } else {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                load();
              }
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenWrapper withLogo edges={["top", "left", "right"]}>
      {currentTab === "ledger" && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={load}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={{ paddingBottom: FINANCE_TAB_BAR_OFFSET + 20 }}
          stickySectionHeadersEnabled
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
              {ledgerEntries.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No documents yet"
                  description="Add invoices, quotes, or other records—they all show up here as your permanent project record."
                  actionTitle="Add to ledger"
                  onAction={openLedgerDocumentCapture}
                />
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No documents match this filter"
                  description="Switch to “All” to see every record, or add a document in this category."
                  actionTitle="Show all"
                  onAction={() => setFilter("all")}
                />
              )}
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View
              style={[
                styles.monthGroup,
                {
                  paddingHorizontal: 24,
                  paddingTop: 6,
                  paddingBottom: 4,
                  backgroundColor: Theme.colors.background,
                },
              ]}
            >
              <View style={styles.monthHeader}>
                <Text style={styles.monthHeaderText}>{title}</Text>
                <View style={styles.monthHeaderLine} />
              </View>
            </View>
          )}
          renderItem={({ item: inv, index }) => (
            <FinanceLedgerEntryRow
              inv={inv as LedgerEntryRow}
              index={index}
              hasProjectPass={hasProjectPass}
              isDeleting={deletingId === (inv as LedgerEntryRow).id}
              onUpgradeClick={() => {
                setUpgradeReason("general");
                setShowUpgrade(true);
              }}
              onPress={() => {
                setSelectedLedgerEntry(inv as LedgerEntryRow);
                setIsReviewOpen(true);
              }}
              onViewOriginal={() =>
                setOriginalPreviewLedgerEntryId((inv as LedgerEntryRow).id)
              }
              onDelete={handleLedgerEntryDelete}
            />
          )}
        />
      )}

      {currentTab === "specs" && project && (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
          <HomeSpecsTab projectId={project.id} />
          <TouchableOpacity
            onPress={() => setIsAddAssetOpen(true)}
            testID="add-spec-fab"
            style={{
              position: "absolute",
              bottom: FINANCE_TAB_BAR_OFFSET + 20,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: Theme.colors.text.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <LedgerEntryReviewSheet
        ledgerEntry={selectedLedgerEntry}
        projectId={project?.id ?? null}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedLedgerEntry(null);
        }}
        onDeleted={() => {
          load();
        }}
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
