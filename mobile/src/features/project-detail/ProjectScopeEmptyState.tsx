import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { projectDetailStyles as styles } from "./project-detail.styles";
import { projectHasEstimateTotals } from "./helpers";
import type { ProjectRow } from "@shared/types/database";

type Props = {
  project: ProjectRow | null;
  scopePollDone: boolean;
  onRefresh: () => void;
};

export function ProjectScopeEmptyState({
  project,
  scopePollDone,
  onRefresh,
}: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.generatingContainer}
    >
      {projectHasEstimateTotals(project) ? (
        !scopePollDone ? (
          <>
            <View style={styles.generatingIcon}>
              <SnurraLoader size={SnurraSize.compact} />
            </View>
            <Text style={styles.generatingTitle}>Loading line items</Text>
            <Text style={styles.generatingText}>
              Your totals are saved. If you had a full breakdown during setup,
              it should show up in a moment. Pull down to refresh if it does
              not.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.generatingTitle}>No line items yet</Text>
            <Text style={styles.generatingText}>
              You still have your estimate totals, but there is no itemized list
              in your project yet. Tap + to add lines, or pull down to refresh.
            </Text>
          </>
        )
      ) : (
        <>
          <Text style={styles.generatingTitle}>No breakdown yet</Text>
          <Text style={styles.generatingText}>
            Add line items with the + button, or start from onboarding with
            photos for an AI-powered scope.
          </Text>
        </>
      )}
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </MotiView>
  );
}
