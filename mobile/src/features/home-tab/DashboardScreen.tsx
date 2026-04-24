import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Plus, PlusCircle, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/auth-context";
import { InsightTeaser } from "@/components/InsightTeaser";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardRecentDocumentsPanel } from "@/components/DashboardRecentDocumentsPanel";
import { ProjectHealth } from "@/components/ProjectHealth";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ResaleValueImpact } from "@/components/ResaleValueImpact";
import { NextStepsChecklist } from "@/components/NextStepsChecklist";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { useAwareness } from "@/contexts/AwarenessContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { generateActivityEvents } from "@/lib/activity";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DASHBOARD_EMPTY_STATE,
  DASHBOARD_SECTION_PLAN_SPENDING,
} from "@shared/copy/dashboard";
import { Theme } from "@/constants/Theme";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardWelcomeBanner } from "@/components/DashboardWelcomeBanner";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Confetti } from "@/components/ui/Confetti";
import { supabase } from "@/lib/supabase";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "@/components/DataLoadErrorFullScreen";
import { DashboardLoadErrorBanner } from "@/components/DashboardLoadErrorBanner";
import { PlanVsActualCard } from "@/components/PlanVsActualCard";
import { RenameProjectModal } from "@/components/RenameProjectModal";
import { friendlyPostgrestMutationError } from "@shared/lib/user-friendly-errors";
import { isFreeTierInvoiceLimitReached } from "@/lib/invoice-upload-gate";
import {
  DOCUMENT_CAPTURE_HOME_COPY,
  presentDocumentCapturePrompt,
} from "@/lib/present-document-capture";
import { uploadPickedDocumentToProject } from "@/lib/upload-picked-document";
import { InvoiceReviewSheet } from "@/components/InvoiceReviewSheet";
import type { InvoiceRow } from "@shared/types/database";
import { buildDashboardHeaderLines } from "@/features/home-tab/dashboard-greeting";
import { presentProjectShareSheet } from "@/lib/share-project";
import { TransformationVault } from "@/components/dashboard/TransformationVault";
import { HomeTeamSection } from "@/components/dashboard/HomeTeamSection";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import { ConfidenceDisplay } from "@/components/ui/ConfidenceDisplay";
import { homeTabStyles as styles } from "@/features/home-tab/home-tab.styles";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { capitalImprovementTotal } from "@/lib/plan-vs-actual";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { reportClientError } from "@/lib/sentry";
import { scopeRowsForSellerPacket } from "@/features/finance-tab/ledger-helpers";

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
    invoices,
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

  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [celebratedProjectId, setCelebratedProjectId] = useState<string | null>(
    null,
  );
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [reviewInvoice, setReviewInvoice] = useState<InvoiceRow | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const capitalDocumentedTotal = useMemo(
    () => capitalImprovementTotal(invoices),
    [invoices],
  );

  const dashboardFirstName = useMemo(() => {
    const raw = user?.user_metadata?.full_name;
    if (typeof raw !== "string" || !raw.trim()) return null;
    return raw.trim().split(/\s+/).filter(Boolean)[0] ?? null;
  }, [user?.user_metadata?.full_name]);

  const { line1: greetingLine, line2: dashboardSubline } = useMemo(
    () =>
      buildDashboardHeaderLines({
        invoicesLength: invoices.length,
        capitalDocumentedTotal,
        estimatedMinTotal: project?.estimated_min_total,
        firstName: dashboardFirstName,
        projectDisplayName: project?.name ?? null,
      }),
    [
      invoices.length,
      capitalDocumentedTotal,
      project?.estimated_min_total,
      dashboardFirstName,
      project?.name,
    ],
  );

  const activityEvents = useMemo(
    () => generateActivityEvents(project, invoices),
    [project, invoices],
  );

  useEffect(() => {
    if (!project) return;
    if (
      invoices.length > 0 &&
      project.estimated_min_total != null &&
      celebratedProjectId !== project.id &&
      capitalDocumentedTotal >= project.estimated_min_total
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCelebrating(true);
      setCelebratedProjectId(project.id);
    }
  }, [project, invoices.length, capitalDocumentedTotal, celebratedProjectId]);

  const handleRenameProject = useCallback(() => {
    if (!project) return;
    Haptics.selectionAsync();
    setRenameVisible(true);
  }, [project]);

  const handleRenameSave = useCallback(
    async (newName: string) => {
      if (!project) return;
      try {
        const { error } = await supabase
          .from("projects")
          .update({ name: newName })
          .eq("id", project.id);
        if (error) throw error;
        setRenameVisible(false);
        load();
      } catch (e) {
        Alert.alert(
          "Couldn't rename project",
          friendlyPostgrestMutationError(e),
        );
      }
    },
    [project, load],
  );

  const handleExportSellerPacket = useCallback(async () => {
    if (!project) return;
    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }
    if (scopeItems.length === 0 && invoices.length === 0) {
      Alert.alert(
        "Nothing to export yet",
        "Add a scope item or upload an invoice, then try Export Packet again.",
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await generateSellerPacketPDF(
        {
          id: project.id,
          property_id: project.property_id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeRowsForSellerPacket(scopeItems),
        invoices,
        { includeAppendix: false },
      );
    } catch (err: unknown) {
      reportClientError("dashboard_seller_packet_pdf", err);
      Alert.alert(
        "Export Failed",
        "We couldn't generate the PDF. Please check your connection and try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    project,
    isArchitect,
    hasProjectPass,
    scopeItems,
    invoices,
    setUpgradeReason,
    setShowUpgrade,
  ]);

  const runDashboardDocumentUpload = useCallback(
    async (files: Array<{ uri: string; mimeType?: string }>) => {
      if (!project) return;

      setIsUploading(true);
      try {
        const result = await uploadPickedDocumentToProject({
          projectId: project.id,
          files,
          successToastMessage: "Document added — your dashboard is updated.",
          onInvoiceLimitUpgrade: () => {
            setUpgradeReason("invoice_limit");
            setShowUpgrade(true);
          },
          refreshProjectData: load,
        });
        if (result.ok && result.lastInvoiceId && files.length === 1) {
          const { data: row } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", result.lastInvoiceId)
            .maybeSingle();
          if (row) {
            setReviewInvoice(row as unknown as InvoiceRow);
            setReviewOpen(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [project, load, setUpgradeReason, setShowUpgrade],
  );

  const openDashboardDocumentCapture = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isFreeTierInvoiceLimitReached(invoices, isArchitect, hasProjectPass)) {
      setUpgradeReason("invoice_limit");
      setShowUpgrade(true);
      return;
    }

    presentDocumentCapturePrompt(DOCUMENT_CAPTURE_HOME_COPY, (files) => {
      void runDashboardDocumentUpload(files);
    });
  }, [
    invoices,
    isArchitect,
    hasProjectPass,
    runDashboardDocumentUpload,
    setUpgradeReason,
    setShowUpgrade,
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
      {loadError ? (
        <DashboardLoadErrorBanner
          message={loadError}
          onRetry={() => void load()}
          onDismiss={clearLoadError}
        />
      ) : null}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerTitleBlock}>
          <TouchableOpacity
            testID="rename-project-trigger"
            onPress={handleRenameProject}
            accessibilityRole="button"
            accessibilityLabel="Rename project"
          >
            <Text
              style={styles.welcomeText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {greetingLine}
            </Text>
            <Text
              style={styles.userFirstName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {dashboardSubline}
            </Text>
            <View style={{ marginTop: 4 }}>
              <ConfidenceDisplay score={project.confidence_score} size={10} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setIsInsightsOpen(true);
            }}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Smart insights"
          >
            <MessageCircle size={22} color={Theme.colors.brand.primary} />
            <View
              style={[
                styles.insightsDot,
                { backgroundColor: Theme.colors.brand.primary },
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openDashboardDocumentCapture}
            disabled={isUploading || isExporting}
            style={[styles.headerBtn, styles.captureBtn]}
            accessibilityRole="button"
            accessibilityLabel="Add document"
          >
            {isUploading || isExporting ? (
              <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
            ) : (
              <Plus size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </MotiView>

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

      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 380, delay: 40 }}
      >
        <Text style={styles.sectionHeader}>Your guided path</Text>
        <NextStepsChecklist
          stage={project.stage || "planning"}
          onAction={(id) => {
            if (id === "review-health") {
              router.push(`/project/${project.id}`);
            } else if (id === "review-scope") {
              router.push(`/project/${project.id}?focus=scope`);
            }
            if (id === "upload-quote" || id === "upload-document") {
              openDashboardDocumentCapture();
            }
            if (id === "export-packet") {
              void handleExportSellerPacket();
            }
            if (id === "share-access") {
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
      </MotiView>

      <Text
        style={[styles.sectionHeader, { marginTop: 28 }]}
        accessibilityRole="header"
      >
        {DASHBOARD_SECTION_PLAN_SPENDING}
      </Text>
      <DashboardStats
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        invoiceTotal={capitalDocumentedTotal}
        documentRowCount={invoices.length}
      />

      <View style={{ marginTop: 20 }}>
        <PlanVsActualCard
          estimatedMin={project.estimated_min_total}
          estimatedMax={project.estimated_max_total}
          invoices={invoices}
          projectId={project.id}
        />
      </View>

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
            invoiceTotal={capitalDocumentedTotal}
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
            invoices={invoices}
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
            invoices={invoices}
            estimatedMin={project.estimated_min_total}
            estimatedMax={project.estimated_max_total}
            hasProjectPass={hasProjectPass}
            onUpgradeClick={onGeneralUpgrade}
            onOpenInvoice={(inv) => {
              void Haptics.selectionAsync();
              setReviewInvoice(inv);
              setReviewOpen(true);
            }}
            onOpenLedger={() => {
              void Haptics.selectionAsync();
              router.push("/(tabs)/finance");
            }}
            onAddDocument={openDashboardDocumentCapture}
          />
        </MotiView>

        {!isArchitect && !hasProjectPass && (
          <InsightTeaser
            projectName={project.name}
            onUpgradePress={() => {
              setUpgradeReason("general");
              setShowUpgrade(true);
            }}
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
      <InvoiceReviewSheet
        invoice={reviewInvoice}
        projectId={project?.id ?? null}
        isOpen={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          setReviewInvoice(null);
        }}
        onDeleted={() => {
          void load();
        }}
        onSaved={() => {
          void load();
        }}
      />
      <Confetti active={isCelebrating} />
    </ScreenWrapper>
  );
}
