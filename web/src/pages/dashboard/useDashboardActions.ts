import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { useLogout } from "@/hooks/use-logout";
import { downloadSellerPacket } from "@/lib/seller-packet-download";
import type { UpgradeOpenReason } from "@/components/dashboard/UpgradeModal";
import type {
  ProjectRow,
  LedgerEntryRow,
  ScopeRow,
} from "@shared/types/database";

type UseDashboardActionsProps = {
  project: ProjectRow;
  projects: ProjectRow[];
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryRow[];
  isArchitect: boolean;
  hasProjectPass: boolean;
  load: (overrideId?: string) => Promise<void>;
  setProjects: (projects: ProjectRow[]) => void;
  setProject: (project: ProjectRow | null) => void;
  setScopeItems: (items: ScopeRow[]) => void;
  setLedgerEntries: (entries: LedgerEntryRow[]) => void;
};

export function useDashboardActions({
  project,
  projects,
  scopeItems,
  ledgerEntries,
  isArchitect,
  hasProjectPass,
  load,
  setProjects,
  setProject,
  setScopeItems,
  setLedgerEntries,
}: UseDashboardActionsProps) {
  const navigate = useNavigate();
  const { logout } = useLogout();

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradeOpenReason>("general");
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectRow | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const handleExportPDF = useCallback(() => {
    if (!isArchitect && !hasProjectPass && import.meta.env.VITE_E2E !== "1") {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }

    void downloadSellerPacket({
      projectId: project.id,
      propertyId: project.property_id,
      project: {
        name: project.name,
        estimated_min_total: project.estimated_min_total,
        estimated_max_total: project.estimated_max_total,
      },
      scopeItems,
      ledgerEntries: ledgerEntries as LedgerEntryRow[],
    });
  }, [project, scopeItems, ledgerEntries, isArchitect, hasProjectPass]);

  const handleProjectDelete = useCallback((p: ProjectRow) => {
    setDeleteProject(p);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteProject || !isSupabaseConfigured()) return;

    const id = deleteProject.id;
    const originalProjects = [...projects];
    const originalCurrentProject = project;

    setProjects(projects.filter((p: ProjectRow) => p.id !== id));
    if (id === project?.id) {
      setProject(null);
      setScopeItems([]);
      setLedgerEntries([]);
    }

    const deleteAction = async () => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;

      if (id === localStorage.getItem("bluprnt_project_id")) {
        localStorage.removeItem("bluprnt_project_id");
      }
      return true;
    };

    setShowDeleteModal(false);

    toast.promise(deleteAction(), {
      loading: "Deleting project...",
      success: () => {
        if (id === originalCurrentProject?.id) {
          load();
        }
        setDeleteProject(null);
        return "Project permanently removed";
      },
      error: () => {
        setProjects(originalProjects);
        setProject(originalCurrentProject);
        setDeleteProject(null);
        return "Failed to delete project. Check your connection and try again.";
      },
    });
  };

  const handleProjectRename = async (id: string, newName: string) => {
    const renameAction = async () => {
      const { error } = await supabase
        .from("projects")
        .update({ name: newName })
        .eq("id", id);
      if (error) throw error;
      load();
    };

    toast.promise(renameAction(), {
      loading: "Renaming project...",
      success: "Project renamed successfully.",
      error: (err: unknown) => {
        reportClientError("dashboard_rename_project", err);
        return "Failed to rename project. Check your connection and try again.";
      },
    });
  };

  const handleProjectArchive = useCallback(
    async (id: string, archived: boolean) => {
      const archiveAction = async () => {
        const { error } = await supabase
          .from("projects")
          .update({ archived })
          .eq("id", id);
        if (error) throw error;
        await load();
      };

      toast.promise(archiveAction(), {
        loading: archived ? "Archiving project..." : "Restoring project...",
        success: archived ? "Project archived" : "Project restored",
        error: (err: unknown) => {
          reportClientError("dashboard_archive_project", err);
          return `Failed to ${archived ? "archive" : "restore"} project.`;
        },
      });
    },
    [load],
  );

  return {
    showUpgrade,
    setShowUpgrade,
    upgradeReason,
    setUpgradeReason,
    shareOpen,
    setShareOpen,
    deleteProject,
    showDeleteModal,
    setShowDeleteModal,
    isAssistantOpen,
    setIsAssistantOpen,
    handleSignOut,
    handleExportPDF,
    handleProjectDelete,
    handleConfirmDelete,
    handleProjectRename,
    handleProjectArchive,
  };
}
