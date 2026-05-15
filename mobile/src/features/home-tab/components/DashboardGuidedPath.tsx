import React from "react";
import { Text } from "react-native";

import { MotiView } from "moti";
import { NextStepsChecklist } from "@/components/NextStepsChecklist";
import { homeTabStyles as styles } from "../home-tab.styles";
import type { LedgerEntryRow } from "@shared/types/database";

interface DashboardGuidedPathProps {
  stage: string | null | undefined;
  ledgerEntries: LedgerEntryRow[];
  onAction: (id: string) => void;
}

export function DashboardGuidedPath({
  stage,
  ledgerEntries,
  onAction,
}: DashboardGuidedPathProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 380, delay: 40 }}
    >
      <Text style={styles.sectionHeader}>Your guided path</Text>
      <NextStepsChecklist
        stage={stage || "planning"}
        ledgerEntries={ledgerEntries}
        onAction={onAction}
      />
    </MotiView>
  );
}
