import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Share } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Plus, PlusCircle, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/auth-context";
import { InsightTeaser } from "@/components/InsightTeaser";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ProjectHealth } from "@/components/ProjectHealth";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ResaleValueImpact } from "@/components/ResaleValueImpact";
import { NextStepsChecklist } from "@/components/NextStepsChecklist";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { useAwareness } from "@/contexts/AwarenessContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { generateActivityEvents } from "@/lib/activity";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { getDashboardGreeting } from "@/features/home-tab/dashboard-greeting";
import { homeTabStyles as styles } from "@/features/home-tab/home-tab.styles";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";

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

  const invoiceTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);

  const greetingLine = useMemo(
    () =>
      getDashboardGreeting({
        invoicesLength: invoices.length,
        invoiceTotal,
        estimatedMinTotal: project?.estimated_min_total,
      }),
    [invoices.length, invoiceTotal, project?.estimated_min_total],
  );

  const [isUploading, setIsUploading] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [reviewInvoice, setReviewInvoice] = useState<InvoiceRow | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (
      project &&
      invoices.length > 0 &&
      project.estimated_min_total != null &&
      !hasCelebrated
    ) {
      if (invoiceTotal >= project.estimated_min_total) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsCelebrating(true);
        setHasCelebrated(true);
      }
    }
  }, [project, invoices, hasCelebrated, invoiceTotal]);

  const handleRenameProject = () => {
    if (!project) return;
    Haptics.selectionAsync();
    setRenameVisible(true);
  };

  const handleRenameSave = async (newName: string) => {
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
      Alert.alert("Couldn't rename project", friendlyPostgrestMutationError(e));
    }
  };

  const openDashboardDocumentCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isFreeTierInvoiceLimitReached(invoices, isArchitect, hasProjectPass)) {
      setUpgradeReason("invoice_limit");
      setShowUpgrade(true);
      return;
    }

    presentDocumentCapturePrompt(DOCUMENT_CAPTURE_HOME_COPY, (uri, mime) => {
      void runDashboardDocumentUpload(uri, mime);
    });
  };

  const runDashboardDocumentUpload = async (
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
        successToastMessage: "Document added — your dashboard is updated.",
        onInvoiceLimitUpgrade: () => {
          setUpgradeReason("invoice_limit");
          setShowUpgrade(true);
        },
        refreshProjectData: load,
      });
      if (result.ok && result.documentType === "invoice" && result.invoiceId) {
        const { data: row } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", result.invoiceId)
          .maybeSingle();
        if (row) {
          setReviewInvoice(row as InvoiceRow);
          setReviewOpen(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

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
        onRefresh={load}
        refreshing={refreshing}
        style={styles.centerContainer}
      >
        <EmptyState
          icon={PlusCircle}
          title="Your home hub is ready"
          description="Set up one renovation and we’ll guide you through vision, an estimate, and your document ledger. Everything starts from the same quick flow below."
          actionTitle="Set up your project"
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
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 800 }}
        style={styles.headerContainer}
      >
        <TouchableOpacity 
          testID="rename-project-trigger"
          onPress={handleRenameProject}
        >
          <Text style={styles.welcomeText}>{greetingLine},</Text>
          <Text style={styles.userFirstName}>
            {project?.name ||
              user?.user_metadata?.full_name?.split(" ")[0] ||
              "there"}
          </Text>
        </TouchableOpacity>
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
            disabled={isUploading}
            style={[styles.headerBtn, styles.captureBtn]}
          >
            {isUploading ? (
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
          if (id === "export") openDashboardDocumentCapture();
        }}
      />

      <DashboardStats
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        invoiceTotal={invoiceTotal}
        invoiceCount={invoices.length}
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
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 150 }}
        >
          <ProjectHealth
            estimatedMin={project.estimated_min_total}
            estimatedMax={project.estimated_max_total}
            invoiceTotal={invoiceTotal}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 350 }}
        >
          <ResaleValueImpact
            investment={invoiceTotal}
            projectName={project.name}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 450 }}
        >
          <Text style={styles.sectionHeader}>Your Guided Path</Text>
          <NextStepsChecklist
            stage={project.stage || "planning"}
            onAction={(id) => {
              if (id === "review-scope") router.push(`/project/${project.id}`);
              if (
                id === "upload-quote" ||
                id === "upload-invoice" ||
                id === "export-packet"
              ) {
                openDashboardDocumentCapture();
              }
              if (id === "share-access") {
                Share.share({
                  message: `Check out my home renovation project '${project.name}' on BLUPRNT.AI!`,
                  url: "https://bluprnt.ai",
                });
              }
            }}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 550 }}
        >
          <ActivityFeed events={generateActivityEvents(project, invoices)} />
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

        <ProjectSwitcher
          projects={projects}
          currentId={project.id}
          onSelect={handleProjectSelect}
          onAdd={() => router.push("/onboarding?newProject=1")}
        />

        <View style={{ height: 120 }} />
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
