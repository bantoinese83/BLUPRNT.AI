import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SectionList,
} from "react-native";
import {
  BookOpen,
  Receipt,
  Wrench,
  ShieldCheck,
  FileDown,
  Plus,
} from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { Button } from "../../src/components/ui/Button";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { money } from "../../src/lib/formatters";
import { ProjectSwitcher } from "../../src/components/ProjectSwitcher";
import { generateSellerPacketPDF } from "../../src/lib/pdf-export";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadDocumentWithType } from "../../src/lib/upload-document";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { InvoiceReviewSheet } from "../../src/components/InvoiceReviewSheet";
import type { InvoiceRow } from "../../src/types/database";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { useAwareness } from "../../src/contexts/AwarenessContext";
import { Theme } from "../../src/constants/Theme";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "./_layout";
import { ConfigurationRequired } from "../../src/components/ConfigurationRequired";
import { DataLoadErrorFullScreen } from "../../src/components/DataLoadErrorFullScreen";
import { DashboardLoadErrorBanner } from "../../src/components/DashboardLoadErrorBanner";
import { showAppToast } from "../../src/lib/app-toast";

const TAB_BAR_OFFSET = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 20;

export default function FinanceScreen() {
  const {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    configurationMissing,
    projects,
    project,
    invoices,
    handleProjectSelect,
    isArchitect,
    hasProjectPass,
    load,
  } = useDashboardData();

  const { showUpgrade, setShowUpgrade, upgradeReason, setUpgradeReason } =
    useAwareness();

  const [filter, setFilter] = useState<"all" | "capital" | "maintenance">(
    "all",
  );
  const [exporting, setExporting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(
    null,
  );
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const stats = useMemo(() => {
    const capital = invoices
      .filter((i) => {
        const type = (i.document_type || "invoice").toLowerCase();
        return type === "invoice" || type === "quote";
      })
      .reduce((s, i) => s + (i.total || 0), 0);

    const maintenance = invoices
      .filter((i) => {
        const type = (i.document_type || "").toLowerCase();
        return type === "warranty" || type === "permit";
      })
      .reduce((s, i) => s + (i.total || 0), 0);

    return { capital, maintenance, total: capital + maintenance };
  }, [invoices]);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [invoices]);

  const groupedInvoices = useMemo(() => {
    const active =
      filter === "all"
        ? sortedInvoices
        : sortedInvoices.filter((i) => {
            const type = (i.document_type || "").toLowerCase();
            if (filter === "capital")
              return type === "invoice" || type === "quote";
            return type === "warranty" || type === "permit";
          });

    const groups: { [key: string]: InvoiceRow[] } = {};
    active.forEach((inv) => {
      const date = new Date(inv.created_at);
      const key = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(inv);
    });
    return groups;
  }, [sortedInvoices, filter]);

  const sections = useMemo(() => {
    return Object.entries(groupedInvoices).map(([month, items]) => ({
      title: month,
      data: items,
    }));
  }, [groupedInvoices]);

  const handleExport = async () => {
    if (!project) return;

    // Gate export behind Architect / Project Pass
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
        [],
        invoices,
      );
    } catch (_error) {
      Alert.alert(
        "Export Failed",
        "We couldn't generate the PDF. Please check your connection.",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleAdd = () => {
    Haptics.selectionAsync();

    // Only count actual invoice documents towards the free tier limit (mirrors web logic)
    const invoiceDocCount = invoices.filter(
      (i) => (i.document_type ?? "invoice") === "invoice",
    ).length;
    if (!isArchitect && !hasProjectPass && invoiceDocCount >= 3) {
      setUpgradeReason("invoice_limit");
      setShowUpgrade(true);
      return;
    }

    Alert.alert(
      "Upload Document",
      "Capture a photo of a receipt, quote, or permit to add it to your ledger.",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Permission Error",
                "We need camera access to capture documents.",
              );
              return;
            }
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
          text: "Select Files",
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
      showAppToast("Document added — your ledger is updated.");
      load();
    } catch (_) {
      Alert.alert("Error", "Failed to process document. Please try again.");
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
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color="white" />
      </ScreenWrapper>
    );
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
          title="No Project Active"
          description="Select a property renovation or create a new one to start tracking your equity and expenses."
          actionTitle="Start New Project"
          onAction={() => router.push("/onboarding")}
        />
      </ScreenWrapper>
    );
  }

  const renderHeader = () => (
    <>
      {loadError ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <DashboardLoadErrorBanner
            message={loadError}
            onRetry={() => void load()}
            onDismiss={clearLoadError}
          />
        </View>
      ) : null}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.pageTitle}>Property Ledger</Text>
          <TouchableOpacity
            style={styles.headerCaptureBtn}
            onPress={handleAdd}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Plus size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <ProjectSwitcher
          projects={projects}
          currentId={project.id}
          onSelect={handleProjectSelect}
          onAdd={() => router.push("/onboarding")}
        />
      </View>

      <View style={styles.content}>
        {/* Main Stats */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 600 }}
        >
          <GlassCard style={styles.mainCard}>
            <View style={styles.ledgerHeader}>
              <View style={styles.iconBox}>
                <BookOpen size={24} color={Theme.colors.brand.primary} />
              </View>
              <View>
                <Text style={styles.ledgerTitle}>Verified Record</Text>
                <Text style={styles.ledgerSubtitle}>
                  Property equity tracking
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <View style={styles.statLabelContainer}>
                  <Wrench size={14} color="#818cf8" />
                  <Text style={styles.statLabel}>Capital</Text>
                </View>
                <Text style={styles.statValue}>{money(stats.capital)}</Text>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statLabelContainer}>
                  <ShieldCheck size={14} color="#10b981" />
                  <Text style={styles.statLabel}>Maintenance</Text>
                </View>
                <Text style={styles.statValue}>{money(stats.maintenance)}</Text>
              </View>
            </View>

            <Button
              title={exporting ? "Generating..." : "Export Seller Packet"}
              onPress={handleExport}
              disabled={exporting}
              style={styles.exportButton}
              icon={
                exporting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FileDown size={18} color="white" />
                )
              }
            />
          </GlassCard>
        </MotiView>

        <SegmentedControl
          options={[
            { label: "All", value: "all" },
            { label: "Capital", value: "capital" },
            { label: "Maintenance", value: "maintenance" },
          ]}
          value={filter}
          onChange={(val: string) => {
            Haptics.selectionAsync();
            setFilter(val as "all" | "capital" | "maintenance");
          }}
          containerStyle={{ marginTop: 32, marginBottom: 16 }}
        />
      </View>
    </>
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
        contentContainerStyle={{ paddingBottom: TAB_BAR_OFFSET + 20 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Receipt size={40} color="#334155" />
            <Text style={styles.emptyListText}>No documents found.</Text>
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
          <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: Math.min(index * 50, 400) }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedInvoice(inv);
                  setIsReviewOpen(true);
                  Haptics.selectionAsync();
                }}
              >
                <GlassCard intensity={8} style={styles.invoiceCard}>
                  <View style={styles.invoiceMain}>
                    <View style={styles.invoiceIcon}>
                      {(inv.document_type || "invoice").toLowerCase() ===
                      "invoice" ? (
                        <Wrench size={18} color="#94a3b8" />
                      ) : (
                        <ShieldCheck size={18} color="#94a3b8" />
                      )}
                    </View>
                    <View style={styles.invoiceText}>
                      <Text style={styles.vendorName}>
                        {inv.vendor_name || "Uncategorized"}
                      </Text>
                      <Text style={styles.invoiceDate}>
                        {new Date(inv.created_at).toLocaleDateString()} •{" "}
                        {inv.document_type || "Invoice"}
                      </Text>
                    </View>
                    <Text style={styles.invoiceAmount}>{money(inv.total)}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </MotiView>
          </View>
        )}
      />

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />

      <InvoiceReviewSheet
        invoice={selectedInvoice}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedInvoice(null);
        }}
        onDeleted={() => {
          load();
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 24,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCaptureBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
  },
  content: {
    paddingHorizontal: 24,
  },
  mainCard: {
    padding: 24,
    borderRadius: 32,
  },
  ledgerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  ledgerTitle: {
    fontSize: 18,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  ledgerSubtitle: {
    fontSize: 12,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    padding: 12,
    borderRadius: 12,
  },
  statLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
  statValue: {
    fontSize: 15,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
  },
  exportButton: {
    height: 52,
    borderRadius: 16,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  filterTabActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Outfit_700Bold",
    color: "#64748b",
  },
  filterTextActive: {
    color: "white",
  },
  listContainer: {
    gap: 12,
  },
  invoiceCard: {
    padding: 12,
  },
  invoiceMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  invoiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceText: {
    flex: 1,
    gap: 2,
  },
  vendorName: {
    fontSize: 14,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  invoiceDate: {
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  invoiceAmount: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  emptyList: {
    padding: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyListText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  monthGroup: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  monthHeaderText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  monthHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.divider,
  },
  emptyText: {
    color: "#94a3b8",
    fontFamily: "Outfit_400Regular",
  },
  fab: {
    position: "absolute",
    bottom: TAB_BAR_OFFSET,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
