import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ListChecks, Share2, Download } from "lucide-react-native";
import { generateSellerPacketPDF } from "../../src/lib/pdf-export";
import { generateProjectShareLink } from "../../src/lib/share-project";
import { UpgradeModal } from "../../src/components/UpgradeModal";
import { supabase } from "../../src/lib/supabase";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ProjectHealth } from "../../src/components/ProjectHealth";
import { ResaleValueImpact } from "../../src/components/ResaleValueImpact";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { ProjectRow, ScopeRow } from "../../src/types/database";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scope, setScope] = useState<ScopeRow[]>([]);
  const { invoices, isArchitect, hasProjectPass } = useDashboardData();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const invoiceTotal = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

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

      const [projRes, scopeRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("scope_items")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (projRes.data) setProject(projRes.data);
      if (scopeRes.data) setScope(scopeRes.data);
      setLoading(false);
    }

    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <ActivityIndicator size="large" color="white" />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper withScroll edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project?.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={handleShare}>
            <Share2 size={20} color="white" />
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

        {/* Scope Title */}
        <View style={styles.sectionHeader}>
          <ListChecks size={20} color="#94a3b8" />
          <Text style={styles.sectionTitle}>Project Scope Details</Text>
        </View>

        {/* Grouped Scope Items */}
        {Object.entries(groupedScope).map(([category, items], catIndex) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: catIndex * 100 + index * 50 }}
              >
                <GlassCard intensity={10} style={styles.scopeCard}>
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
                </GlassCard>
              </MotiView>
            ))}
          </View>
        ))}

        {/* Global Actions */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 500 }}
          style={styles.globalActions}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.shareBtn]}
            onPress={handleShare}
          >
            <Share2 size={18} color="white" />
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
                await generateSellerPacketPDF(
                  {
                    id: project.id,
                    property_id: project.property_id,
                    name: project.name,
                    estimated_min_total: project.estimated_min_total,
                    estimated_max_total: project.estimated_max_total,
                  },
                  scope,
                  invoices,
                );
              } catch (err) {
                Alert.alert(
                  "Export Failed",
                  "Cloud not create project scope PDF.",
                );
              }
            }}
          >
            <Download size={18} color="white" />
            <Text style={styles.actionButtonText}>Export Data</Text>
          </TouchableOpacity>
        </MotiView>
      </View>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="export"
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
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22, // Increased for impact
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
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
    fontFamily: "Outfit_700Bold",
    color: "white",
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
    fontFamily: "Outfit_700Bold",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  tierBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tierText: {
    fontSize: 10,
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  scopeDescription: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "white",
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
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 8,
  },
  scopeMeta: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
  },
  scopePrice: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  globalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
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
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  shareBtn: {
    backgroundColor: "#4f46e5",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  exportBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
