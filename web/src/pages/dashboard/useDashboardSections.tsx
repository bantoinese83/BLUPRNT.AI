import { useMemo } from "react";
import { ResaleValueImpact } from "@/components/dashboard/ResaleValueImpact";
import { PropertyLedger } from "@/components/dashboard/PropertyLedger";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { TransformationVault } from "@/components/dashboard/TransformationVault";
import { HomeTeamSection } from "@/components/dashboard/HomeTeamSection";
import { HomeSpecsVault } from "@/components/dashboard/HomeSpecsVault";
import { ProjectHealth } from "@/components/dashboard/ProjectHealth";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import type { UpgradeOpenReason } from "@/components/dashboard/UpgradeModal";
import type {
  ProjectRow,
  LedgerEntryRow,
  ScopeRow,
} from "@shared/types/database";
import type { ResaleImpactResult } from "@shared/lib/resale-value";
import type { Contractor } from "@shared/lib/home-team";

type UseDashboardSectionsProps = {
  project: ProjectRow;
  projects: ProjectRow[];
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryRow[];
  memoHomeTeam: Contractor[];
  memoInvestmentTotal: number;
  memoResaleImpact: ResaleImpactResult;
  isArchitect: boolean;
  hasProjectPass: boolean;
  load: (overrideId?: string) => Promise<void>;
  setShowUpgrade: (val: boolean) => void;
  setUpgradeReason: (reason: UpgradeOpenReason) => void;
};

export function useDashboardSections({
  project,
  scopeItems,
  ledgerEntries,
  memoHomeTeam,
  memoInvestmentTotal,
  memoResaleImpact,
  isArchitect,
  hasProjectPass,
  load,
  setShowUpgrade,
  setUpgradeReason,
}: UseDashboardSectionsProps) {
  const stats = useMemo(
    () => (
      <DashboardStats
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        spendingTotal={memoInvestmentTotal}
        documentRowCount={ledgerEntries.length}
      />
    ),
    [
      project.estimated_min_total,
      project.estimated_max_total,
      memoInvestmentTotal,
      ledgerEntries.length,
    ],
  );

  const health = useMemo(
    () => (
      <ProjectHealth
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        spendingTotal={memoInvestmentTotal}
      />
    ),
    [
      project.estimated_min_total,
      project.estimated_max_total,
      memoInvestmentTotal,
    ],
  );

  const transformationVault = useMemo(
    () => <TransformationVault projectId={project.id} />,
    [project.id],
  );

  const homeSpecsVault = useMemo(
    () => <HomeSpecsVault projectId={project.id} />,
    [project.id],
  );

  const homeTeam = useMemo(
    () => (
      <HomeTeamSection
        team={memoHomeTeam}
        isArchitect={isArchitect}
        hasProjectPass={hasProjectPass}
        onUpgradeClick={() => setShowUpgrade(true)}
      />
    ),
    [memoHomeTeam, isArchitect, hasProjectPass, setShowUpgrade],
  );

  const ledger = useMemo(
    () => (
      <div className="space-y-6">
        <ResaleValueImpact
          investment={memoInvestmentTotal}
          resaleImpact={memoResaleImpact}
          projectName={project.name}
        />
        <PropertyLedger
          projectId={project.id}
          propertyId={project.property_id}
          project={{
            name: project.name,
            estimated_min_total: project.estimated_min_total,
            estimated_max_total: project.estimated_max_total,
          }}
          scopeItems={scopeItems}
          ledgerEntries={ledgerEntries}
          canExportSellerPacket={isArchitect || hasProjectPass}
          onExportNotAllowed={() => {
            setUpgradeReason("export");
            setShowUpgrade(true);
          }}
        />
      </div>
    ),
    [
      memoInvestmentTotal,
      memoResaleImpact,
      project.name,
      project.id,
      project.property_id,
      project.estimated_min_total,
      project.estimated_max_total,
      scopeItems,
      ledgerEntries,
      isArchitect,
      hasProjectPass,
      setUpgradeReason,
      setShowUpgrade,
    ],
  );

  const documentsComp = useMemo(
    () => (
      <DocumentsSection
        projectId={project.id}
        documents={ledgerEntries as any}
        onUploaded={load}
        onUpgradeClick={(reason) => {
          setUpgradeReason(
            reason === "invoice_limit" ? "invoice_limit" : "general",
          );
          setShowUpgrade(true);
        }}
        subscription={null} // Pass subscription if needed
        hasProjectPass={hasProjectPass}
      />
    ),
    [
      project.id,
      ledgerEntries,
      load,
      hasProjectPass,
      setUpgradeReason,
      setShowUpgrade,
    ],
  );

  return {
    stats,
    health,
    transformationVault,
    homeSpecsVault,
    homeTeam,
    ledger,
    documentsComp,
  };
}
