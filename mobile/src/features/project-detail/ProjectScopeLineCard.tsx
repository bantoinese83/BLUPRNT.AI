import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  HeartPulse,
} from "lucide-react-native";
import { AnimatePresence } from "moti";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import { ProjectBillOfMaterialsList } from "./ProjectBillOfMaterialsList";
import { ReconciledDocumentsList } from "./ReconciledDocumentsList";

import { ConfidenceDisplay } from "@/components/ui/ConfidenceDisplay";
import type { ScopeRow, LedgerEntryRow } from "@shared/types/database";
import type { ReconciliationItem } from "@shared/lib/reconciliation";
import { money } from "@shared/lib/formatters";
import { type BillOfMaterialItem } from "@shared/types/onboarding";
import { RECONCILIATION_STATUS_LABELS } from "@shared/copy/dashboard";

type Props = {
  item: ScopeRow;
  reconciliation?: ReconciliationItem | null;
  ledgerEntries?: LedgerEntryRow[];
  catIndex: number;
  index: number;
  expandedId: string | null;
  onToggleExpand: (itemId: string) => void;
  onPersistScopeMaterials?: (
    scopeItemId: string,
    next: BillOfMaterialItem[],
  ) => Promise<void>;
};

export const ProjectScopeLineCard = React.memo(
  ({
    item,
    reconciliation,
    ledgerEntries,
    catIndex,
    index,
    expandedId,
    onToggleExpand,
    onPersistScopeMaterials,
  }: Props) => {
    const isOpen = expandedId === item.id;
    const materialRows = item.metadata?.materials;
    const hasMaterialBreakdown = Array.isArray(materialRows);

    // AI Insights from metadata
    const justification = item.metadata?.justification;
    const careTips =
      item.metadata?.care_tips || item.metadata?.maintenance_tips;

    return (
      <MotiView
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
          style={[styles.scopeCard, isOpen && styles.expandedScopeCard]}
        >
          <View style={styles.scopeHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={styles.scopeDescription}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <ConfidenceDisplay score={item.confidence_score} size={8} />
                {(justification || careTips) && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Sparkles size={10} color={Theme.colors.status.info} />
                    <Text
                      style={{
                        fontSize: 9,
                        fontFamily: Theme.typography.family.bold,
                        color: Theme.colors.status.info,
                        textTransform: "uppercase",
                      }}
                    >
                      AI Insights
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{item.finish_tier}</Text>
            </View>
          </View>
          <View style={styles.scopeFooter}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scopeMeta}>
                {item.quantity} {item.unit}
              </Text>
              {reconciliation && reconciliation.total_billed > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  {reconciliation.status === "reconciled" ? (
                    <CheckCircle2
                      size={10}
                      color={Theme.colors.status.success}
                    />
                  ) : reconciliation.status === "over" ? (
                    <AlertTriangle
                      size={10}
                      color={Theme.colors.status.error}
                    />
                  ) : (
                    <Info size={10} color={Theme.colors.status.warning} />
                  )}
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: Theme.typography.family.black,
                      color:
                        reconciliation.status === "reconciled"
                          ? Theme.colors.status.success
                          : reconciliation.status === "over"
                            ? Theme.colors.status.error
                            : Theme.colors.status.warning,
                      textTransform: "uppercase",
                    }}
                  >
                    {reconciliation.status === "reconciled"
                      ? RECONCILIATION_STATUS_LABELS.reconciled
                      : reconciliation.status}{" "}
                    {money(reconciliation.total_billed)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.scopePrice}>
              {money(item.total_cost_min, item.total_cost_max)}
            </Text>
          </View>

          {(hasMaterialBreakdown ||
            ledgerEntries ||
            justification ||
            careTips) && (
            <>
              <TouchableOpacity
                style={[
                  styles.viewDetailsBtn,
                  isOpen && styles.activeViewDetailsBtn,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggleExpand(item.id);
                }}
              >
                <Text
                  style={[
                    styles.viewDetailsText,
                    isOpen && styles.activeViewDetailsText,
                  ]}
                >
                  {isOpen ? "Hide Breakdown" : "View Breakdown"}
                </Text>
                {isOpen ? (
                  <ChevronUp size={14} color="white" />
                ) : (
                  <ChevronDown size={14} color={Theme.colors.text.secondary} />
                )}
              </TouchableOpacity>

              <AnimatePresence>
                {isOpen && (
                  <MotiView
                    from={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "timing", duration: 300 }}
                    style={{ overflow: "hidden" }}
                  >
                    {/* Justification Section */}
                    {justification && (
                      <View
                        style={{
                          padding: 12,
                          backgroundColor: "rgba(14, 165, 233, 0.05)",
                          borderRadius: 12,
                          marginBottom: 8,
                          marginTop: 8,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <Sparkles
                            size={12}
                            color={Theme.colors.status.info}
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: Theme.typography.family.black,
                              color: Theme.colors.status.info,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Why this cost?
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: Theme.colors.text.primary,
                            lineHeight: 18,
                          }}
                        >
                          {justification}
                        </Text>
                      </View>
                    )}

                    {/* Care Tips Section */}
                    {careTips && (
                      <View
                        style={{
                          padding: 12,
                          backgroundColor: "rgba(16, 185, 129, 0.05)",
                          borderRadius: 12,
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <HeartPulse
                            size={12}
                            color={Theme.colors.status.success}
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: Theme.typography.family.black,
                              color: Theme.colors.status.success,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Maintenance Tips
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: Theme.colors.text.primary,
                            lineHeight: 18,
                          }}
                        >
                          {careTips}
                        </Text>
                      </View>
                    )}

                    {/* Materials Section */}
                    {hasMaterialBreakdown && (
                      <ProjectBillOfMaterialsList
                        materials={materialRows}
                        onPersist={
                          onPersistScopeMaterials
                            ? (next) => onPersistScopeMaterials(item.id, next)
                            : undefined
                        }
                      />
                    )}

                    {/* Reconciled Spend Section */}
                    {ledgerEntries && (
                      <ReconciledDocumentsList
                        scopeItemId={item.id}
                        ledgerEntries={ledgerEntries}
                      />
                    )}
                  </MotiView>
                )}
              </AnimatePresence>
            </>
          )}
        </GlassCard>
      </MotiView>
    );
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.expandedId === next.expandedId &&
      prev.reconciliation === next.reconciliation &&
      prev.item.quantity === next.item.quantity &&
      prev.item.finish_tier === next.item.finish_tier &&
      prev.item.description === next.item.description &&
      prev.item.confidence_score === next.item.confidence_score &&
      prev.item.metadata?.justification === next.item.metadata?.justification &&
      (prev.item.metadata?.care_tips ||
        prev.item.metadata?.maintenance_tips) ===
        (next.item.metadata?.care_tips ||
          next.item.metadata?.maintenance_tips) &&
      prev.item.metadata?.materials === next.item.metadata?.materials
    );
  },
);
