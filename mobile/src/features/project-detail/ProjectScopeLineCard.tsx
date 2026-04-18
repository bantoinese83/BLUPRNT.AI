import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { AnimatePresence } from "moti";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import { ProjectMaterialDetailList } from "./ProjectMaterialDetailList";
import type { ScopeRow } from "@shared/types/database";

type Props = {
  item: ScopeRow;
  catIndex: number;
  index: number;
  expandedId: string | null;
  onToggleExpand: (itemId: string) => void;
};

export function ProjectScopeLineCard({
  item,
  catIndex,
  index,
  expandedId,
  onToggleExpand,
}: Props) {
  const isOpen = expandedId === item.id;

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
          <Text style={styles.scopeMeta}>
            {item.quantity} {item.unit}
          </Text>
          <Text style={styles.scopePrice}>
            ${(item.total_cost_min || 0).toLocaleString()} - $
            {(item.total_cost_max || 0).toLocaleString()}
          </Text>
        </View>

        {item.metadata?.materials && item.metadata.materials.length > 0 && (
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
                    materials={item.metadata.materials}
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
