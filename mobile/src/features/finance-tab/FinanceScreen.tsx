import React, { useMemo, useState } from "react";
import { View, Text, Alert, SectionList } from "react-native";
import { BookOpen, Receipt } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useDashboardData } from "@/hooks/useDashboardData";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { UpgradeModal } from "@/components/UpgradeModal";
import { InvoiceReviewSheet } from "@/components/InvoiceReviewSheet";
import type { InvoiceRow } from "@shared/types/database";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAwareness } from "@/contexts/AwarenessContext";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { FinanceTabSkeleton } from "@/components/TabLoadingSkeletons";
import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import { isFreeTierInvoiceLimitReached } from "@/lib/invoice-upload-gate";
import {
  DOCUMENT_CAPTURE_LEDGER_COPY,
  presentDocumentCapturePrompt,
} from "@/lib/present-document-capture";
import { uploadPickedDocumentToProject } from "@/lib/upload-picked-document";
import { FINANCE_TAB_BAR_OFFSET } from "@/features/finance-tab/constants";
import {
  computeLedgerStats,
  sortInvoicesByDateDesc,
  groupInvoicesByMonth,
  groupedInvoicesToSections,
  scopeRowsForSellerPacket,
  type InvoiceLedgerFilter,
} from "@/features/finance-tab/ledger-helpers";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";
import { reportClientError } from "@/lib/sentry";
import { supabase } from "@/lib/supabase";
import { FinanceLedgerHeader } from "@/features/finance-tab/FinanceLedgerHeader";
import { FinanceInvoiceRow } from "@/features/finance-tab/FinanceInvoiceRow";

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
    invoices,
    handleProjectSelect,
    isArchitect,
    hasProjectPass,
    load,
  } = useDashboardData();

  const { showUpgrade, setShowUpgrade, upgradeReason, setUpgradeReason } =
    useAwareness();

  const [filter, setFilter] = useState<InvoiceLedgerFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(
    null,
  );
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [originalPreviewInvoiceId, setOriginalPreviewInvoiceId] = useState<
    string | null
  >(null);

  const stats = useMemo(() => computeLedgerStats(invoices), [invoices]);

  const sortedInvoices = useMemo(
    () => sortInvoicesByDateDesc(invoices),
    [invoices],
  );

  const scopeForSellerPacket = useMemo(
    () => scopeRowsForSellerPacket(scopeItems),
    [scopeItems],
  );

  const groupedInvoices = useMemo(
    () => groupInvoicesByMonth(sortedInvoices, filter),
    [sortedInvoices, filter],
  );

  const sections = useMemo(
    () => groupedInvoicesToSections(groupedInvoices),
    [groupedInvoices],
  );

  const handleExport = async () => {
    if (!project) return;

    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
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
        invoices,
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
  };

  const openLedgerDocumentCapture = () => {
    Haptics.selectionAsync();

    if (isFreeTierInvoiceLimitReached(invoices, isArchitect, hasProjectPass)) {
      setUpgradeReason("invoice_limit");
      setShowUpgrade(true);
      return;
    }

    presentDocumentCapturePrompt(DOCUMENT_CAPTURE_LEDGER_COPY, (uri, mime) => {
      void runLedgerDocumentUpload(uri, mime);
    });
  };

  const runLedgerDocumentUpload = async (
    fileUri: string,
    mimeType?: string,
  ) => {
    if (!project) return;

    setIsUploading(true);
    try {
      const result = await uploadPickedDocumentToProject({
        projectId: project.id,
        fileUri,
        mimeType,
        successToastMessage: "Document added — your ledger is updated.",
        onInvoiceLimitUpgrade: () => {
          setUpgradeReason("invoice_limit");
          setShowUpgrade(true);
        },
        refreshProjectData: load,
      });
      if (result.ok && result.invoiceId) {
        const { data: row } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", result.invoiceId)
          .maybeSingle();
        if (row) {
          setSelectedInvoice(row as InvoiceRow);
          setIsReviewOpen(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

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
        withScroll
        onRefresh={load}
        refreshing={refreshing}
      >
        <EmptyState
          icon={BookOpen}
          title="Your home hub is ready"
          description="Set up a renovation to track your ledger, equity, and documents — same quick flow as the Home tab."
          actionTitle="Start your BLUPRNT"
          actionTitleCase="sentence"
          onAction={() => router.push("/onboarding?newProject=1")}
        />
      </ScreenWrapper>
    );
  }

  const renderHeader = () => (
    <FinanceLedgerHeader
      loadError={loadError}
      onRetryLoad={() => void load()}
      onDismissLoadError={clearLoadError}
      projects={projects}
      project={project}
      onProjectSelect={handleProjectSelect}
      onPressAddDocument={openLedgerDocumentCapture}
      isUploading={isUploading}
      stats={stats}
      includeAppendix={includeAppendix}
      onIncludeAppendixChange={setIncludeAppendix}
      exporting={exporting}
      onExport={handleExport}
      invoices={invoices}
      filter={filter}
      onFilterChange={setFilter}
    />
  );

  return (
    <ScreenWrapper edges={["top", "left", "right"]}>
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
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <EmptyState
              icon={Receipt}
              title="Nothing in your ledger yet"
              description="Add invoices, quotes, or receipts—they all show up here as your project record."
              actionTitle="Add to ledger"
              onAction={openLedgerDocumentCapture}
            />
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.monthGroup, { paddingHorizontal: 24 }]}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthHeaderText}>{title}</Text>
              <View style={styles.monthHeaderLine} />
            </View>
          </View>
        )}
        renderItem={({ item: inv, index }) => (
          <FinanceInvoiceRow
            inv={inv}
            index={index}
            onPress={() => {
              setSelectedInvoice(inv);
              setIsReviewOpen(true);
              Haptics.selectionAsync();
            }}
            onViewOriginal={() => setOriginalPreviewInvoiceId(inv.id)}
          />
        )}
      />

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />

      <InvoiceReviewSheet
        invoice={selectedInvoice}
        projectId={project?.id ?? null}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedInvoice(null);
        }}
        onDeleted={() => {
          load();
        }}
        onSaved={() => {
          void load();
        }}
      />

      {originalPreviewInvoiceId ? (
        <OriginalUploadPreviewModal
          key={originalPreviewInvoiceId}
          invoiceId={originalPreviewInvoiceId}
          onClose={() => setOriginalPreviewInvoiceId(null)}
        />
      ) : null}
    </ScreenWrapper>
  );
}
