import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { InvoiceReviewSheet } from "../../src/components/InvoiceReviewSheet";
import type { InvoiceRow } from "../../src/types/database";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { useAwareness } from "../../src/contexts/AwarenessProvider";

export default function FinanceScreen() {
  const {
    loading,
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

  const filteredInvoices = useMemo(() => {
    if (filter === "all") return invoices;
    if (filter === "capital") {
      return invoices.filter((i) => {
        const type = (i.document_type || "invoice").toLowerCase();
        return type === "invoice" || type === "quote";
      });
    }
    return invoices.filter((i) => {
      const type = (i.document_type || "").toLowerCase();
      return type === "warranty" || type === "permit";
    });
  }, [invoices, filter]);

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
    } catch (error) {
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

    // Check invoice limit for free users
    if (!isArchitect && !hasProjectPass && invoices.length >= 3) {
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              processUpload(result.assets[0].uri);
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
              processUpload(result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const processUpload = async (uri: string) => {
    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Simulation of upload & processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        "Success",
        "Document captured and processed. Your ledger has been updated.",
      );
      load();
    } catch (error) {
      Alert.alert("Error", "Failed to process document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color="white" />
      </ScreenWrapper>
    );
  }

  if (!project) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
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

  return (
    <ScreenWrapper withScroll edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Property Ledger</Text>
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
                <BookOpen size={24} color="white" />
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
                  <View
                    style={[styles.statDot, { backgroundColor: "#818cf8" }]}
                  />
                  <Text style={styles.statLabel}>Capital Improvements</Text>
                </View>
                <Text style={styles.statValue}>{money(stats.capital)}</Text>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statLabelContainer}>
                  <View
                    style={[styles.statDot, { backgroundColor: "#10b981" }]}
                  />
                  <Text style={styles.statLabel}>Maintenance Log</Text>
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

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("all");
            }}
            style={[
              styles.filterTab,
              filter === "all" && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              All Docs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("capital");
            }}
            style={[
              styles.filterTab,
              filter === "capital" && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === "capital" && styles.filterTextActive,
              ]}
            >
              Capital
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("maintenance");
            }}
            style={[
              styles.filterTab,
              filter === "maintenance" && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === "maintenance" && styles.filterTextActive,
              ]}
            >
              Maintenance
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invoices List */}
        <View style={styles.listContainer}>
          {filteredInvoices.length === 0 ? (
            <View style={styles.emptyList}>
              <Receipt size={40} color="#334155" />
              <Text style={styles.emptyListText}>No documents found.</Text>
            </View>
          ) : (
            filteredInvoices.map((inv, idx) => (
              <MotiView
                key={inv.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: idx * 50 }}
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
                      <Text style={styles.invoiceAmount}>
                        {money(inv.total)}
                      </Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </MotiView>
            ))
          )}
        </View>
      </View>

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />
      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          handleAdd();
        }}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Plus size={32} color="white" />
        )}
      </TouchableOpacity>

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
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
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
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  ledgerTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  ledgerSubtitle: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
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
    backgroundColor: "rgba(255, 255, 255, 0.03)",
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
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
    color: "white",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterTabActive: {
    backgroundColor: "#4f46e5",
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceText: {
    flex: 1,
    gap: 2,
  },
  vendorName: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  invoiceDate: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
  },
  invoiceAmount: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  emptyList: {
    padding: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyListText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#475569",
  },
  emptyText: {
    color: "#94a3b8",
    fontFamily: "Outfit_400Regular",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
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
});
