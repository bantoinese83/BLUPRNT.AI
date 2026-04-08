import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Plus, PlusCircle, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useAuth } from "../../src/contexts/auth-context";
import { InsightTeaser } from "../../src/components/InsightTeaser";
import { ActivityFeed } from "../../src/components/ActivityFeed";
import { ProjectHealth } from "../../src/components/ProjectHealth";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { ResaleValueImpact } from "../../src/components/ResaleValueImpact";
import { NextStepsChecklist } from "../../src/components/NextStepsChecklist";
import { ProjectSwitcher } from "../../src/components/ProjectSwitcher";
import { useAwareness } from "../../src/contexts/AwarenessContext";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { generateActivityEvents } from "../../src/lib/activity";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadDocumentWithType } from "../../src/lib/upload-document";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { Theme } from "../../src/constants/Theme";
import { DashboardStats } from "../../src/components/DashboardStats";
import { DashboardWelcomeBanner } from "../../src/components/DashboardWelcomeBanner";
import { DashboardSkeleton } from "../../src/components/DashboardSkeleton";
import { Confetti } from "../../src/components/ui/Confetti";
import { supabase } from "../../src/lib/supabase";
import { ConfigurationRequired } from "../../src/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "../../src/components/DataLoadErrorFullScreen";
import { DashboardLoadErrorBanner } from "../../src/components/DashboardLoadErrorBanner";
import { showAppToast } from "../../src/lib/app-toast";
import { PlanVsActualCard } from "../../src/components/PlanVsActualCard";

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

  const getGreeting = () => {
    if (invoices.length > 0) {
      if (
        project?.estimated_min_total &&
        invoiceTotal >= project.estimated_min_total
      ) {
        return "Budget reached";
      }
      return `${invoices.length} Documents tracked`;
    }
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const [isUploading, setIsUploading] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Budget Completion Celebration
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

    if (Platform.OS === "ios") {
      Alert.prompt(
        "Rename Project",
        "Enter a new name for your renovation project.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (newName?: string) => {
              if (!newName?.trim()) return;
              try {
                const { error } = await supabase
                  .from("projects")
                  .update({ name: newName.trim() })
                  .eq("id", project.id);
                if (error) throw error;
                load();
              } catch (_e) {
                Alert.alert("Error", "Could not rename project.");
              }
            },
          },
        ],
        "plain-text",
        project.name,
      );
    } else {
      // Android / Fallback: Simple prompt isn't built-in, so we use a standard alert for now
      // (Future: Custom Modal)
      Alert.alert(
        "Rename project",
        "Feature available in Profile -> Managed Projects.",
      );
    }
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const invoiceDocCount = invoices.filter(
      (i) => (i.document_type ?? "invoice") === "invoice",
    ).length;
    if (!isArchitect && !hasProjectPass && invoiceDocCount >= 3) {
      setUpgradeReason("invoice_limit");
      setShowUpgrade(true);
      return;
    }

    Alert.alert(
      "Document Capture",
      "Upload receipts, quotes, or contracts to keep your project benchmarks up to date.",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") return;

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              processUpload(result.assets[0].uri, "image/jpeg");
            }
          },
        },
        {
          text: "Choose Files",
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ["application/pdf", "image/*"],
            });

            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              processUpload(asset.uri, asset.mimeType || "image/jpeg");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const processUpload = async (uri: string, mimeType?: string) => {
    if (!project) return;

    setIsUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await uploadDocumentWithType(
        uri,
        mimeType || "image/jpeg",
        project.id,
      );

      if (!result.success) {
        if (result.error) {
          if (
            result.error.includes("limit") ||
            result.error.includes("Architect") ||
            result.error.includes("Free")
          ) {
            setUpgradeReason("invoice_limit");
            setShowUpgrade(true);
          } else {
            Alert.alert("Upload Failed", result.error);
          }
        }
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAppToast("Document added — your dashboard is updated.");
      load();
    } catch (_) {
      Alert.alert("Error", "Failed to process document. Please try again.");
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
      {/* Personalized Greeting */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 800 }}
        style={styles.headerContainer}
      >
        <TouchableOpacity onPress={handleRenameProject}>
          <Text style={styles.welcomeText}>{getGreeting()},</Text>
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
            onPress={handleFabPress}
            disabled={isUploading}
            style={[styles.headerBtn, styles.captureBtn]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Plus size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </MotiView>

      <DashboardWelcomeBanner
        onAction={(id) => {
          if (id === "upload") handleFabPress();
          if (id === "scope") router.push(`/project/${project.id}`);
          if (id === "export") handleFabPress();
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
        {/* Project Health Index */}
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

        {/* Resale ROI Impact */}
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

        {/* Your Guided Path (Checklist) */}
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
                handleFabPress();
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

        {/* Activity Feed */}
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

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />
      <Confetti active={isCelebrating} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
  },
  sectionHeader: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 16,
    marginLeft: 4,
    marginTop: 8,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  captureBtn: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: "transparent",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  userFirstName: {
    fontSize: 28,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  insightsDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.header,
  },
});
