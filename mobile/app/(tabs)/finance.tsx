import React from "react";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import FinanceScreenFeature from "@/features/finance-tab/FinanceScreen";

export default function FinanceScreen() {
  return (
    <ComponentErrorBoundary name="Finance">
      <FinanceScreenFeature />
    </ComponentErrorBoundary>
  );
}
