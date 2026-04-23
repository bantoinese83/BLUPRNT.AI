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
} from "lucide-react-native";
import { AnimatePresence } from "moti";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import { ProjectMaterialDetailList } from "./ProjectMaterialDetailList";
import type { ScopeRow } from "@shared/types/database";
import type { ReconciliationItem } from "@shared/lib/reconciliation";
import { money } from "@shared/lib/formatters";

type Props = {
  item: ScopeRow;
  reconciliation?: ReconciliationItem | null;
  catIndex: number;
  index: number;
  expandedId: string | null;
  onToggleExpand: (itemId: string) => void;
  onPersistScopeMaterials?: (
    scopeItemId: string,
    next: NonNullable<ScopeRow["metadata"]>["materials"],
  ) => Promise<void>;
};

export function ProjectScopeLineCard({
  item,
  reconciliation,
  catIndex,
  index,
  expandedId,
  onToggleExpand,
  onPersistScopeMaterials,
}: Props) {
  const isOpen = expandedId === item.id;
  const materialRows = item.metadata?.materials;
  const hasMaterialBreakdown = Array.isArray(materialRows);

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
          <Text
            style={styles.scopeDescription}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
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
                  <CheckCircle2 size={10} color={Theme.colors.status.success} />
                ) : reconciliation.status === "over" ? (
                  <AlertTriangle size={10} color={Theme.colors.status.error} />
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
                  Billed {money(reconciliation.total_billed)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.scopePrice}>
            ${(item.total_cost_min || 0).toLocaleString()} - $
            {(item.total_cost_max || 0).toLocaleString()}
          </Text>
        </View>

        {hasMaterialBreakdown && (
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
                  <ProjectMaterialDetailList
                    materials={materialRows}
                    onPersist={
                      onPersistScopeMaterials
                        ? (next) => onPersistScopeMaterials(item.id, next)
                        : undefined
                    }
                  />
                </MotiView>
              )}
            </AnimatePresence>
          </>
        )}
      </GlassCard>
    </MotiView>
  );
}
