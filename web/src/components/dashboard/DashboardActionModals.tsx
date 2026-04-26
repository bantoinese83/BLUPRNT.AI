import {
  UpgradeModal,
  type UpgradeOpenReason,
} from "@/components/dashboard/UpgradeModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { DeleteProjectModal } from "@/components/dashboard/DeleteProjectModal";
import { AIAssistantWidget } from "@/components/AIAssistantWidget";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";

import type { ProjectRow } from "@shared/types/database";

type DashboardActionModalsProps = {
  project: ProjectRow | null;
  showUpgrade: boolean;
  setShowUpgrade: (val: boolean) => void;
  upgradeReason: UpgradeOpenReason;
  setUpgradeReason: (reason: UpgradeOpenReason) => void;
  shareOpen: boolean;
  setShareOpen: (val: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  deleteProjectName: string;
  handleConfirmDelete: () => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (val: boolean) => void;
  isArchitect: boolean;
};

export function DashboardActionModals({
  project,
  showUpgrade,
  setShowUpgrade,
  upgradeReason,
  setUpgradeReason,
  shareOpen,
  setShareOpen,
  showDeleteModal,
  setShowDeleteModal,
  deleteProjectName,
  handleConfirmDelete,
  isAssistantOpen,
  setIsAssistantOpen,
  isArchitect,
}: DashboardActionModalsProps) {
  return (
    <>
      <ComponentErrorBoundary name="Billing">
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => {
            setShowUpgrade(false);
            setUpgradeReason("general");
          }}
          openReason={upgradeReason}
          isArchitect={isArchitect}
        />
      </ComponentErrorBoundary>

      <LeadCaptureModal />

      {project && (
        <>
          <ShareModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            projectId={project.id}
          />

          <DeleteProjectModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            projectName={deleteProjectName}
          />

          <AIAssistantWidget
            projectId={project.id}
            isOpen={isAssistantOpen}
            onOpenChange={setIsAssistantOpen}
          />
        </>
      )}
    </>
  );
}
