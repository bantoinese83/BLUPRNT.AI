import React from "react";
import { View, Text } from "react-native";
import { DashboardStats } from "@/components/DashboardStats";
import { PlanVsActualCard } from "@/components/PlanVsActualCard";
import { DASHBOARD_SECTION_PLAN_SPENDING } from "@shared/copy/dashboard";
import { homeTabStyles as styles } from "../home-tab.styles";
import type { InvoiceRow } from "@shared/types/database";

interface DashboardSpendingSectionProps {
  estimatedMin: number | null | undefined;
  estimatedMax: number | null | undefined;
  invoiceTotal: number;

  invoices: InvoiceRow[];
  projectId: string;
}

export function DashboardSpendingSection({
  estimatedMin,
  estimatedMax,
  invoiceTotal,
  invoices,
  projectId,
}: DashboardSpendingSectionProps) {
  return (
    <View>
      <Text
        style={[styles.sectionHeader, { marginTop: 28 }]}
        accessibilityRole="header"
      >
        {DASHBOARD_SECTION_PLAN_SPENDING}
      </Text>
      <DashboardStats
        estimatedMin={estimatedMin ?? null}
        estimatedMax={estimatedMax ?? null}
        invoiceTotal={invoiceTotal}
        documentRowCount={invoices.length}
      />

      <View style={{ marginTop: 20 }}>
        <PlanVsActualCard
          estimatedMin={estimatedMin ?? null}
          estimatedMax={estimatedMax ?? null}
          invoices={invoices}
          projectId={projectId}
        />
      </View>
    </View>
  );
}
