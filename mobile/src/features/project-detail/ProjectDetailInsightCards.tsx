import React from "react";
import { MotiView } from "moti";
import { ProjectHealth } from "@/components/ProjectHealth";
import { ResaleValueImpact } from "@/components/ResaleValueImpact";
import type { ProjectRow } from "@shared/types/database";

type Props = {
  project: ProjectRow;
  invoiceTotal: number;
};

export function ProjectDetailInsightCards({ project, invoiceTotal }: Props) {
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
          spendingTotal={invoiceTotal}
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600, delay: 100 }}
      >
        <ResaleValueImpact
          investment={invoiceTotal || project.estimated_min_total || 0}
          projectName={project.name}
        />
      </MotiView>
    </>
  );
}
