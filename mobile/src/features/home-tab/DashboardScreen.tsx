import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View } from "react-native";

import { router } from "expo-router";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/auth-context";
import { InsightTeaser } from "@/components/InsightTeaser";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardRecentDocumentsPanel } from "@/components/DashboardRecentDocumentsPanel";
import { ProjectHealth } from "@/components/ProjectHealth";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ResaleValueImpact } from "@/components/ResaleValueImpact";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { useAwareness } from "@/contexts/AwarenessContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { generateActivityEvents } from "@/lib/activity";
import { EmptyState } from "@/components/ui/EmptyState";
import { DASHBOARD_EMPTY_STATE } from "@shared/copy/dashboard";
import { PlusCircle } from "lucide-react-native";
import { DashboardWelcomeBanner } from "@/components/DashboardWelcomeBanner";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Confetti } from "@/components/ui/Confetti";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { DashboardLoadErrorBanner } from "@/components/DashboardLoadErrorBanner";
import { RenameProjectModal } from "@/components/RenameProjectModal";
import { LedgerEntryReviewSheet } from "@/components/LedgerEntryReviewSheet";
import type { LedgerEntryRow } from "@shared/types/database";
import { buildDashboardHeaderLines } from "@/features/home-tab/dashboard-greeting";
import { presentProjectShareSheet } from "@/lib/share-project";
import { TransformationVault } from "@/components/dashboard/TransformationVault";
import { HomeTeamSection } from "@/components/dashboard/HomeTeamSection";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import { homeTabStyles as styles } from "@/features/home-tab/home-tab.styles";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { capitalImprovementTotal } from "@shared/lib/plan-vs-actual";

// Sub-components
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardGuidedPath } from "./components/DashboardGuidedPath";
import { DashboardSpendingSection } from "./components/DashboardSpendingSection";

// Sub-hooks
import { useDashboardHandlers } from "./useDashboardHandlers";

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    configurationMissing,
    projects,
    project,
    ledgerEntries,
    scopeItems,
    load,
    handleProjectSelect,
    isArchitect,
    hasProjectPass,
  } = useDashboardData();

  const {
    setIsInsightsOpen,
    showUpgrade,
    setShowUpgrade,
    upgradeReason,
    setUpgradeReason,
  } = useAwareness();

  const [celebratedProjectId, setCelebratedProjectId] = useState<string | null>(
    null,
  );
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [reviewLedgerEntry, setReviewLedgerEntry] =
    useState<LedgerEntryRow | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const capitalDocumentedTotal = useMemo(
    () => capitalImprovementTotal(ledgerEntries as LedgerEntryRow[]),
    [ledgerEntries],
  );

  const dashboardFirstName = useMemo(() => {
    const raw = user?.user_metadata?.full_name;
    if (typeof raw !== "string" || !raw.trim()) return null;
    return raw.trim().split(/\s+/).filter(Boolean)[0] ?? null;
  }, [user?.user_metadata?.full_name]);

  const { line1: greetingLine, line2: dashboardSubline } = useMemo(
    () =>
      buildDashboardHeaderLines({
        ledgerEntriesLength: ledgerEntries.length,
        capitalDocumentedTotal,
        estimatedMinTotal: project?.estimated_min_total,
        firstName: dashboardFirstName,
        projectDisplayName: project?.name ?? null,
      }),
    [
      ledgerEntries.length,
      capitalDocumentedTotal,
      project?.estimated_min_total,
      dashboardFirstName,
      project?.name,
    ],
  );

  const activityEvents = useMemo(
    () =>
      project
        ? generateActivityEvents(project, ledgerEntries as LedgerEntryRow[])
        : [],
    [project, ledgerEntries],
  );

  const {
    isUploading,
    isExporting,
    renameVisible,
    setRenameVisible,
    handleRenameSave,
    handleExportSellerPacket,
    openDashboardDocumentCapture,
  } = useDashboardHandlers({
    project,
    ledgerEntries,
    scopeItems,
    isArchitect,
    hasProjectPass,
    load,
    setUpgradeReason,
    setShowUpgrade,
    setReviewLedgerEntry,
    setReviewOpen,
  });

  useEffect(() => {
    if (!project) return;
    if (
      ledgerEntries.length > 0 &&
      project.estimated_min_total != null &&
      celebratedProjectId !== project.id &&
      capitalDocumentedTotal >= project.estimated_min_total
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCelebrating(true);
      setCelebratedProjectId(project.id);
    }
  }, [
    project,
    ledgerEntries.length,
    capitalDocumentedTotal,
    celebratedProjectId,
  ]);

  const onGeneralUpgrade = useCallback(() => {
    setUpgradeReason("general");
    setShowUpgrade(true);
  }, [setUpgradeReason, setShowUpgrade]);

  if (configurationMissing) {
    return (
      <ScreenWrapper withLogo style={styles.centerContainer}>
        <ConfigurationRequired onRetry={() => void load()} />
      </ScreenWrapper>
    );
  }

  if (loading && !project) {
    return <DashboardSkeleton />;
  }

  if (loadError && !project && projects.length === 0) {
    return (
      <ScreenWrapper withLogo style={styles.centerContainer}>
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
        withLogo
        withScroll
        onRefresh={load}
        refreshing={refreshing}
        style={styles.centerContainer}
      >
        <EmptyState
          icon={PlusCircle}
          title={DASHBOARD_EMPTY_STATE.title}
          description={DASHBOARD_EMPTY_STATE.description}
          actionTitle={DASHBOARD_EMPTY_STATE.primaryCta}
          onAction={() => router.push("/onboarding?newProject=1")}
          withRoadmap
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      withLogo
      withScroll
      onRefresh={load}
      refreshing={refreshing}
      style={styles.scrollContent}
    >
      {loadError && (
        <DashboardLoadErrorBanner
          message={loadError}
          onRetry={() => void load()}
          onDismiss={clearLoadError}
        />
      )}

      <DashboardHeader
        greetingLine={greetingLine}
        dashboardSubline={dashboardSubline}
        confidenceScore={project.confidence_score}
        isUploading={isUploading}
        isExporting={isExporting}
        onRenamePress={() => setRenameVisible(true)}
        onInsightsPress={() => {
          setIsInsightsOpen(true);
        }}
        onAddDocumentPress={openDashboardDocumentCapture}
      />

      <DashboardWelcomeBanner
        onAction={(id) => {
          if (id === "upload") openDashboardDocumentCapture();
          if (id === "scope") router.push(`/project/${project.id}`);
          if (id === "export") void handleExportSellerPacket();
        }}
      />

      <View style={{ marginTop: 4, marginBottom: 8 }}>
        <ProjectSwitcher
          projects={projects}
          currentId={project.id}
          onSelect={handleProjectSelect}
          onAdd={() => router.push("/onboarding?newProject=1")}
        />
      </View>

      <DashboardGuidedPath
        stage={project.stage}
        onAction={(id) => {
          if (id === "review-health") {
            router.push(`/project/${project.id}`);
          } else if (id === "review-scope") {
            router.push(`/project/${project.id}?focus=scope`);
          } else if (id === "upload-quote" || id === "upload-document") {
            openDashboardDocumentCapture();
          } else if (id === "export-packet") {
            void handleExportSellerPacket();
          } else if (id === "share-access") {
            void (async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await presentProjectShareSheet({
                id: project.id,
                name: project.name,
              });
            })();
          }
        }}
      />

      <DashboardSpendingSection
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        invoiceTotal={capitalDocumentedTotal}
        ledgerEntries={ledgerEntries as LedgerEntryRow[]}
        projectId={project.id}
      />

      <View style={{ gap: 24, marginTop: 24 }}>
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 80 }}
        >
          <TransformationVault projectId={project.id} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 100 }}
        >
          <ProjectHealth
            estimatedMin={project.estimated_min_total}
            estimatedMax={project.estimated_max_total}
            spendingTotal={capitalDocumentedTotal}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 140 }}
        >
          <ResaleValueImpact
            investment={capitalDocumentedTotal}
            projectName={project.name}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 160 }}
        >
          <HomeTeamSection
            ledgerEntries={ledgerEntries as LedgerEntryRow[]}
            isArchitect={isArchitect}
            hasProjectPass={hasProjectPass}
            onUpgradeClick={onGeneralUpgrade}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 170 }}
        >
          <GroundingSourcesSection project={project} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 180 }}
        >
          <ActivityFeed events={activityEvents} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 210 }}
        >
          <DashboardRecentDocumentsPanel
            ledgerEntries={ledgerEntries as LedgerEntryRow[]}
            estimatedMin={project.estimated_min_total}
            estimatedMax={project.estimated_max_total}
            hasProjectPass={hasProjectPass}
            onUpgradeClick={onGeneralUpgrade}
            onOpenLedgerEntry={(inv) => {
              Haptics.selectionAsync();
              setReviewLedgerEntry(inv);
              setReviewOpen(true);
            }}
            onOpenLedger={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/finance");
            }}
            onAddDocument={openDashboardDocumentCapture}
          />
        </MotiView>

        {!isArchitect && !hasProjectPass && (
          <InsightTeaser
            projectName={project.name}
            onUpgradePress={onGeneralUpgrade}
          />
        )}
      </View>

      <RenameProjectModal
        key={`${project.id}-${renameVisible ? "open" : "closed"}`}
        visible={renameVisible}
        initialName={project.name}
        onClose={() => setRenameVisible(false)}
        onSave={handleRenameSave}
      />

      <ComponentErrorBoundary name="Payments">
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          reason={upgradeReason}
        />
      </ComponentErrorBoundary>

      <LedgerEntryReviewSheet
        ledgerEntry={reviewLedgerEntry}
        projectId={project?.id ?? null}
        isOpen={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          setReviewLedgerEntry(null);
        }}
        onDeleted={load}
        onSaved={load}
      />
      <Confetti active={isCelebrating} />
    </ScreenWrapper>
  );
}
