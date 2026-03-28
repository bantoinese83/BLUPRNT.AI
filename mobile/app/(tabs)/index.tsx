import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import {
  Hammer,
  CircleDollarSign,
  Calendar,
  PlusCircle,
  Plus,
  ShieldCheck,
  MessageCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useAuth } from "../../src/contexts/auth-context";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { Button } from "../../src/components/ui/Button";
import { InsightTeaser } from "../../src/components/InsightTeaser";
import { ActivityFeed, ActivityEvent } from "../../src/components/ActivityFeed";
import { ProjectHealth } from "../../src/components/ProjectHealth";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { SkeletonLoader } from "../../src/components/ui/SkeletonLoader";
import { LinearGradient } from "expo-linear-gradient";
import { ResaleValueImpact } from "../../src/components/ResaleValueImpact";
import { NextStepsChecklist } from "../../src/components/NextStepsChecklist";
import { ProjectSwitcher } from "../../src/components/ProjectSwitcher";
import { useAwareness } from "../../src/contexts/AwarenessProvider";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { generateActivityEvents } from "../../src/lib/activity";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../src/lib/supabase";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { Theme } from "../../src/constants/Theme";

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    loading,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const [isUploading, setIsUploading] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Budget Completion Celebration
  React.useEffect(() => {
    if (
      project &&
      invoices.length > 0 &&
      project.estimated_min_total != null &&
      !hasCelebrated
    ) {
      const invoiceTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
      if (invoiceTotal >= project.estimated_min_total) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHasCelebrated(true);
      }
    }
  }, [project, invoices, hasCelebrated]);

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Check invoice limit for free users
    if (!isArchitect && !hasProjectPass && invoices.length >= 3) {
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
              processUpload(result.assets[0].uri);
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
              processUpload(result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const processUpload = async (uri: string) => {
    if (!project) return;

    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Simulation of upload & processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        "Analysis Complete",
        "Document captured and processed. Your dashboard has been updated.",
      );
      load();
    } catch (error) {
      Alert.alert("Error", "Failed to process document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading && !project) {
    return (
      <ScreenWrapper withLogo style={styles.scrollContent}>
        <View style={{ gap: 24 }}>
          <SkeletonLoader height={180} borderRadius={24} />
          <SkeletonLoader height={120} borderRadius={24} />
          <SkeletonLoader height={240} borderRadius={24} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!project) {
    return (
      <ScreenWrapper withLogo style={styles.centerContainer}>
        <EmptyState
          icon={PlusCircle}
          title="No projects yet"
          description="Create your first property renovation to start tracking benchmarks, managing documents, and getting AI insights."
          actionTitle="Start New Project"
          onAction={() => router.push("/onboarding")}
        />
      </ScreenWrapper>
    );
  }

  const invoiceTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);

  return (
    <ScreenWrapper
      withLogo
      withScroll
      onRefresh={load}
      refreshing={loading}
      style={styles.scrollContent}
    >
      {/* Personalized Greeting */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 800 }}
        style={styles.headerContainer}
      >
        <View>
          <Text style={styles.welcomeText}>{getGreeting()},</Text>
          <Text style={styles.userFirstName}>
            {user?.user_metadata?.full_name?.split(" ")[0] || "there"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setIsInsightsOpen(true);
          }}
          style={styles.insightsButton}
        >
          <MessageCircle size={24} color={Theme.colors.brand.light} />
          <View
            style={[
              styles.insightsDot,
              { backgroundColor: Theme.colors.brand.light },
            ]}
          />
        </TouchableOpacity>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
      >
        <Text style={styles.sectionHeader}>Active Project</Text>
        <GlassCard style={{ marginBottom: 24 }}>
          <View style={styles.projectHeader}>
            <View style={styles.projectIcon}>
              <Hammer size={24} color={Theme.colors.brand.primary} />
            </View>
            <View style={styles.projectNameContainer}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectStage}>
                {project.stage || "Planning"}
              </Text>
            </View>
            <View style={styles.confidenceBadge}>
              <ShieldCheck size={12} color={Theme.colors.status.success} />
              <Text style={styles.confidenceText}>
                {(project as any).confidence_score ?? 4.8}/5
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatItem
              label="Budget"
              value={`$${(project.estimated_min_total ?? 0).toLocaleString()}`}
              icon={
                <CircleDollarSign
                  size={16}
                  color={Theme.colors.text.secondary}
                />
              }
            />
            <StatItem
              label="Spent"
              value={`$${invoiceTotal.toLocaleString()}`}
              icon={<Calendar size={16} color={Theme.colors.text.secondary} />}
            />
          </View>

          <Button
            title="View Full Scope"
            variant="outline"
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/project/${project.id}`);
            }}
            style={{ marginTop: 20 }}
          />
        </GlassCard>
      </MotiView>

      <View style={{ gap: 24 }}>
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

        {/* Budget Progress */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 250 }}
        >
          <GlassCard intensity={10} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Project Progress</Text>
              <Text style={styles.budgetValue}>
                {project.estimated_min_total
                  ? Math.round(
                      (invoiceTotal / project.estimated_min_total) * 100,
                    )
                  : 0}
                %
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <MotiView
                from={{ width: "0%" }}
                animate={{
                  width: `${Math.min(100, project.estimated_min_total ? (invoiceTotal / project.estimated_min_total) * 100 : 0)}%`,
                }}
                style={styles.progressBarFill}
              >
                <LinearGradient
                  colors={[
                    Theme.colors.brand.light,
                    Theme.colors.brand.primary,
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </MotiView>
            </View>

            <Text style={styles.budgetNote}>
              Based on paid invoices vs. minimum estimate
            </Text>
          </GlassCard>
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
          onAdd={() => router.push("/onboarding")}
        />

        {/* Extra Bottom Padding for FAB comfort */}
        <View style={{ height: 80 }} />
      </View>

      {/* Branded FAB with Pulse */}
      <View style={styles.fabContainer}>
        {!isUploading && (
          <MotiView
            from={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{
              type: "timing",
              duration: 2000,
              loop: true,
              repeatReverse: false,
            }}
            style={styles.fabPulse}
          />
        )}
        <MotiView
          from={{ opacity: 0, scale: 0.5, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 1000 }}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={handleFabPress}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Plus size={32} color="white" />
            )}
          </TouchableOpacity>
        </MotiView>
      </View>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />
    </ScreenWrapper>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statLabelRow}>
        {icon}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.light,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 16,
    marginLeft: 4,
    opacity: 0.8,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.2)",
  },
  projectNameContainer: {
    flex: 1,
  },
  projectName: {
    fontSize: 22,
    fontFamily: "Outfit_700Bold",
    color: "white",
    letterSpacing: -0.5,
  },
  projectStage: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.15)",
  },
  confidenceText: {
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    color: "#10b981",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: "#64748b",
    marginLeft: 6,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    width: "100%",
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  otherProjectName: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "white",
  },
  otherProjectsSection: {
    marginTop: 8,
    marginBottom: 100,
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  miniProjectCard: {
    width: "48%",
  },
  miniProjectInner: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
  },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  budgetCard: {
    padding: 20,
    marginBottom: 24,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  budgetValue: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "#818cf8",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  budgetNote: {
    fontSize: 9,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 30,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
  },
  userFirstName: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: "white",
    letterSpacing: -0.5,
  },
  insightsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  insightsDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0f172a",
  },
});
