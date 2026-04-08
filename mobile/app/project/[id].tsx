import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Switch,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import {
  ChevronLeft,
  Share2,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
  Tag,
  Boxes,
} from "lucide-react-native";
import { AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { generateSellerPacketPDF } from "../../src/lib/pdf-export";
import { generateProjectShareLink } from "../../src/lib/share-project";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { supabase, isSupabaseConfigured } from "../../src/lib/supabase";
import { ConfigurationRequired } from "../../src/components/ConfigurationRequired";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ProjectHealth } from "../../src/components/ProjectHealth";
import { ResaleValueImpact } from "../../src/components/ResaleValueImpact";
import { AddScopeItemModal } from "../../src/components/AddScopeItemModal";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { InvoiceRow, ProjectRow, ScopeRow } from "../../src/types/database";
import { Theme } from "../../src/constants/Theme";

type BillOfMaterialItem = NonNullable<
  NonNullable<ScopeRow["metadata"]>["materials"]
>[number];

function projectHasEstimateTotals(p: ProjectRow | null): boolean {
  if (!p) return false;
  const min = p.estimated_min_total;
  const max = p.estimated_max_total;
  return (
    (typeof min === "number" && Number.isFinite(min) && min > 0) ||
    (typeof max === "number" && Number.isFinite(max) && max > 0)
  );
}

function MaterialDetailList({
  materials,
}: {
  materials: NonNullable<ScopeRow["metadata"]>["materials"];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <View style={styles.materialContainer}>
      <View style={styles.materialHeader}>
        <Package size={12} color={Theme.colors.brand.primary} />
        <Text style={styles.materialHeaderText}>Bill of Materials</Text>
      </View>
      <View style={styles.materialGrid}>
        {materials.map((m: BillOfMaterialItem, idx: number) => (
          <View key={idx} style={styles.materialCard}>
            <View style={styles.materialIconBg}>
              <Boxes size={14} color={Theme.colors.text.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{m.name}</Text>
              <View style={styles.materialMetaRow}>
                {m.brand && (
                  <View style={styles.brandTag}>
                    <Tag size={10} color={Theme.colors.brand.primary} />
                    <Text style={styles.brandText}>{m.brand}</Text>
                  </View>
                )}
                {m.quantity && (
                  <Text style={styles.materialQuantity}>
                    {m.quantity} {m.unit || "units"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProjectDetailScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scope, setScope] = useState<ScopeRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailInvoices, setDetailInvoices] = useState<InvoiceRow[]>([]);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const { isArchitect, hasProjectPass, addItem } = useDashboardData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  /** After brief polling, true means we stop showing "syncing" when DB has totals but no scope rows. */
  const [scopePollDone, setScopePollDone] = useState(false);

  const invoiceTotal = detailInvoices.reduce(
    (sum, inv) => sum + (inv.total || 0),
    0,
  );

  // Group scope by category
  const groupedScope = scope.reduce(
    (acc, item) => {
      const cat = item.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, ScopeRow[]>,
  );

  const handleShare = async () => {
    if (!project) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await generateProjectShareLink(project.id);
      if (res.ok && res.url) {
        await Share.share({
          message: `Check out my project: ${project.name} on BLUPRNT.AI\n\n${res.url}`,
          url: res.url,
          title: project.name,
        });
      } else {
        Alert.alert("Error", res.message || "Could not generate share link.");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  useEffect(() => {
    async function fetchProject() {
      if (!id) return;

      setLoading(true);
      queueMicrotask(() => setScopePollDone(false));

      const [projRes, scopeRes, invRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("scope_items")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("invoices")
          .select(
            "id, vendor_name, total, created_at, payment_status, document_type, document_id",
          )
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (projRes.data) setProject(projRes.data);
      setScope(scopeRes.data ?? []);
      if (scopeRes.error) {
        console.warn("[project] scope_items", scopeRes.error.message);
      }
      setDetailInvoices((invRes.data ?? []) as InvoiceRow[]);
      setLoading(false);
    }

    fetchProject();
  }, [id]);

  // When totals exist but scope rows are still empty (e.g. edge still writing rows),
  // poll briefly; then show a non-loading "range only" state so the screen never looks stuck.
  useEffect(() => {
    if (!id || loading) return;

    if (scope.length > 0) {
      queueMicrotask(() => setScopePollDone(true));
      return;
    }

    if (!projectHasEstimateTotals(project)) {
      queueMicrotask(() => setScopePollDone(true));
      return;
    }

    queueMicrotask(() => setScopePollDone(false));
    let attempts = 0;
    const maxAttempts = 8;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchScopeOnly = async () => {
      const { data, error } = await supabase
        .from("scope_items")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      if (cancelled) return false;
      if (error) {
        console.warn("[project] scope_items poll", error.message);
        return false;
      }
      if (data?.length) {
        setScope(data);
        return true;
      }
      return false;
    };

    const finish = () => {
      if (interval) clearInterval(interval);
      interval = null;
      if (!cancelled) setScopePollDone(true);
    };

    void (async () => {
      const immediate = await fetchScopeOnly();
      if (immediate || cancelled) {
        if (immediate) finish();
        else if (!cancelled) queueMicrotask(() => setScopePollDone(true));
        return;
      }
      interval = setInterval(async () => {
        attempts += 1;
        const done = await fetchScopeOnly();
        if (done || attempts >= maxAttempts) finish();
      }, 2500);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
    // Intentionally omit `project`: use estimate totals primitives to avoid
    // re-running polling on unrelated project field updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [
    id,
    loading,
    project?.estimated_min_total,
    project?.estimated_max_total,
    scope.length,
  ]);

  const handleRefresh = async () => {
    setLoading(true);
    setScopePollDone(false);
    const [projRes, scopeRes, invRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("scope_items")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("invoices")
        .select(
          "id, vendor_name, total, created_at, payment_status, document_type, document_id",
        )
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    setScope(scopeRes.data ?? []);
    if (scopeRes.error) {
      console.warn("[project] scope_items refresh", scopeRes.error.message);
    }
    setDetailInvoices((invRes.data ?? []) as InvoiceRow[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.brand.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      withScroll
      withTabBar={false}
      onRefresh={handleRefresh}
      refreshing={loading}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backButton}
        >
          <BlurView
            intensity={20}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <ChevronLeft size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project?.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleShare();
            }}
          >
            <BlurView
              intensity={10}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <Share2 size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionIcon,
              { backgroundColor: Theme.colors.brand.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
          {project && (
            <ProjectHealth
              estimatedMin={project.estimated_min_total}
              estimatedMax={project.estimated_max_total}
              invoiceTotal={invoiceTotal}
            />
          )}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 100 }}
        >
          {project && (
            <ResaleValueImpact
              investment={invoiceTotal || project.estimated_min_total || 0}
              projectName={project.name}
            />
          )}
        </MotiView>

        {Object.entries(groupedScope).length > 0 ? (
          Object.entries(groupedScope).map(([category, items], catIndex) => (
            <MotiView
              key={category}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 600,
                delay: 200 + catIndex * 150,
              }}
              style={styles.categorySection}
            >
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.map((item, index) => (
                <MotiView
                  key={item.id}
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 300 + catIndex * 150 + index * 50,
                  }}
                >
                  <GlassCard
                    intensity={10}
                    style={[
                      styles.scopeCard,
                      expandedId === item.id && styles.expandedScopeCard,
                    ]}
                  >
                    <View style={styles.scopeHeader}>
                      <Text style={styles.scopeDescription}>
                        {item.description}
                      </Text>
                      <View style={styles.tierBadge}>
                        <Text style={styles.tierText}>{item.finish_tier}</Text>
                      </View>
                    </View>
                    <View style={styles.scopeFooter}>
                      <Text style={styles.scopeMeta}>
                        {item.quantity} {item.unit}
                      </Text>
                      <Text style={styles.scopePrice}>
                        ${(item.total_cost_min || 0).toLocaleString()} - $
                        {(item.total_cost_max || 0).toLocaleString()}
                      </Text>
                    </View>

                    {item.metadata?.materials &&
                      item.metadata.materials.length > 0 && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.viewDetailsBtn,
                              expandedId === item.id &&
                                styles.activeViewDetailsBtn,
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setExpandedId(
                                expandedId === item.id ? null : item.id,
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.viewDetailsText,
                                expandedId === item.id &&
                                  styles.activeViewDetailsText,
                              ]}
                            >
                              {expandedId === item.id
                                ? "Hide Breakdown"
                                : "View Breakdown"}
                            </Text>
                            {expandedId === item.id ? (
                              <ChevronUp size={14} color="white" />
                            ) : (
                              <ChevronDown
                                size={14}
                                color={Theme.colors.text.secondary}
                              />
                            )}
                          </TouchableOpacity>

                          <AnimatePresence>
                            {expandedId === item.id && (
                              <MotiView
                                from={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "timing", duration: 300 }}
                                style={{ overflow: "hidden" }}
                              >
                                <MaterialDetailList
                                  materials={item.metadata.materials}
                                />
                              </MotiView>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                  </GlassCard>
                </MotiView>
              ))}
            </MotiView>
          ))
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.generatingContainer}
          >
            {projectHasEstimateTotals(project) ? (
              !scopePollDone ? (
                <>
                  <View style={styles.generatingIcon}>
                    <ActivityIndicator
                      size="small"
                      color={Theme.colors.brand.primary}
                    />
                  </View>
                  <Text style={styles.generatingTitle}>Loading line items</Text>
                  <Text style={styles.generatingText}>
                    Your totals are saved. If you had a full breakdown during
                    setup, it should show up in a moment. Pull down to refresh
                    if it does not.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.generatingTitle}>No line items yet</Text>
                  <Text style={styles.generatingText}>
                    You still have your estimate totals, but there is no
                    itemized list in your project yet. Tap + to add lines, or
                    pull down to refresh.
                  </Text>
                </>
              )
            ) : (
              <>
                <Text style={styles.generatingTitle}>No breakdown yet</Text>
                <Text style={styles.generatingText}>
                  Add line items with the + button, or start from onboarding
                  with photos for an AI-powered scope.
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Global Actions */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 500 }}
          style={styles.globalActions}
        >
          <View style={styles.exportAppendixRow}>
            <View style={styles.exportAppendixTextCol}>
              <Text style={styles.exportAppendixLabel}>
                Append image originals
              </Text>
              <Text style={styles.exportAppendixHint}>
                Larger PDF. PDF uploads appear as notes only.
              </Text>
            </View>
            <Switch
              value={includeAppendix}
              onValueChange={setIncludeAppendix}
              disabled={!detailInvoices.some((i) => Boolean(i.document_id))}
              trackColor={{
                false: "rgba(148,163,184,0.35)",
                true: Theme.colors.brand.primary,
              }}
              thumbColor={Theme.colors.inputBg}
            />
          </View>
          <View style={styles.globalActionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareBtn]}
              onPress={handleShare}
            >
              <Share2 size={18} color={Theme.colors.text.primary} />
              <Text style={styles.actionButtonText}>Share Project</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.exportBtn]}
              onPress={async () => {
                if (!project) return;

                // Gate export
                if (!isArchitect && !hasProjectPass) {
                  setShowUpgrade(true);
                  return;
                }

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                try {
                  const scopeForPdf = scope.map((s) => ({
                    category: s.category,
                    description: s.description,
                    total_cost_min: s.total_cost_min,
                    total_cost_max: s.total_cost_max,
                  }));
                  await generateSellerPacketPDF(
                    {
                      id: project.id,
                      property_id: project.property_id,
                      name: project.name,
                      estimated_min_total: project.estimated_min_total,
                      estimated_max_total: project.estimated_max_total,
                    },
                    scopeForPdf,
                    detailInvoices,
                    { includeAppendix },
                  );
                } catch (_) {
                  Alert.alert(
                    "Export Failed",
                    "We couldn’t generate the PDF. Check your connection and try again.",
                  );
                }
              }}
            >
              <Download size={18} color={Theme.colors.text.primary} />
              <Text style={styles.actionButtonText}>Export Seller Packet</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="export"
      />

      <AddScopeItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (item) => {
          if (!id) return;
          await addItem(id, item);
          handleRefresh(); // Refresh screen data
        }}
      />
    </ScreenWrapper>
  );
}

export default function ProjectDetailScreen() {
  if (!isSupabaseConfigured()) {
    return (
      <ScreenWrapper>
        <ConfigurationRequired onRetry={() => router.replace("/(tabs)")} />
      </ScreenWrapper>
    );
  }
  return <ProjectDetailScreenInner />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22, // Increased for impact
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginLeft: 12,
  },
  scopeCard: {
    marginBottom: 12,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  tierBadge: {
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  tierText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.muted,
    textTransform: "capitalize",
  },
  scopeDescription: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
    marginRight: 12,
  },
  scopeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scopeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    paddingTop: 8,
  },
  scopeMeta: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  scopePrice: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  globalActions: {
    gap: 14,
    marginTop: 20,
    marginBottom: 40,
  },
  globalActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  exportAppendixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  exportAppendixTextCol: {
    flex: 1,
    gap: 4,
  },
  exportAppendixLabel: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  exportAppendixHint: {
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56, // Synchronized with global comfort standard
    borderRadius: 18,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  shareBtn: {
    backgroundColor: Theme.colors.card,
    borderColor: Theme.colors.glass.border,
  },
  exportBtn: {
    backgroundColor: Theme.colors.card,
    borderColor: Theme.colors.glass.border,
  },
  materialContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: 14,
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  materialHeaderText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  materialGrid: {
    gap: 8,
  },
  materialCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
  },
  materialIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  materialName: {
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  materialMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  brandTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
  },
  materialQuantity: {
    fontSize: 10,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    gap: 6,
  },
  activeViewDetailsBtn: {
    backgroundColor: Theme.colors.text.primary,
  },
  viewDetailsText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
  },
  activeViewDetailsText: {
    color: "white",
  },
  expandedScopeCard: {
    borderColor: "rgba(79, 70, 229, 0.2)",
    borderWidth: 1,
  },
  generatingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 20,
  },
  generatingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  generatingTitle: {
    fontSize: 18,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  generatingText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Theme.colors.brand.primary,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
});
