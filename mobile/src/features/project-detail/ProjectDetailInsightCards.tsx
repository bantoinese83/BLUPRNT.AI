import React from "react";
import { MotiView } from "moti";
import { ProjectHealth } from "@/components/ProjectHealth";
import { ResaleValueImpact } from "@/components/ResaleValueImpact";
import type { ProjectRow } from "@shared/types/database";

type Props = {
  project: ProjectRow;
  ledgerTotal: number;
  documentCount?: number;
  scopeLineCount?: number;
  unreconciledBilled?: number;
};

export function ProjectDetailInsightCards({
  project,
  ledgerTotal,
  documentCount = 0,
  scopeLineCount = 0,
  unreconciledBilled = 0,
}: Props) {
  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
      >
        <ProjectHealth
          estimatedMin={project.estimated_min_total}
          estimatedMax={project.estimated_max_total}
          spendingTotal={ledgerTotal}
          documentCount={documentCount}
          scopeLineCount={scopeLineCount}
          unreconciledBilled={unreconciledBilled}
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600, delay: 100 }}
      >
        <ResaleValueImpact
          investment={ledgerTotal || project.estimated_min_total || 0}
          projectName={project.name}
        />
      </MotiView>
    </>
  );
}
