import { useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import {
  FilePlus2,
  Share2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Activity,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareModal } from "./ShareModal";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { ProjectRow } from "@shared/types/database";

interface ProjectHeaderProps {
  project: ProjectRow;
  onRename?: (newName: string) => void;
}

export const ProjectHeader = memo(function ProjectHeader({
  project,
  onRename,
}: ProjectHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(project.name);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempName.trim() && tempName !== project.name) {
      onRename?.(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(project.name);
    setIsEditing(false);
  };

  const copyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(project.id);
      setCopied(true);
      toast.success("Project ID copied to clipboard", {
        description: project.id,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy project ID");
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-teal-950 text-white border-teal-900 gap-1.5 font-medium hover:bg-teal-900 transition-colors"
          >
            <Activity className="w-3 h-3 text-teal-400 fill-teal-400" />
            Active project
          </Badge>
          {project.estimated_max_total &&
            project.estimated_max_total > 30000 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200/50 gap-1.5 font-bold animate-in fade-in slide-in-from-left-2 duration-500"
              >
                <AlertTriangle className="w-3 h-3" />
                High Value Project
              </Badge>
            )}
          <button
            onClick={copyProjectId}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
              "bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200 hover:text-slate-600 hover:bg-slate-100",
              copied && "text-emerald-600 border-emerald-100 bg-emerald-50",
            )}
            title="Copy project ID"
            aria-label="Copy project ID"
          >
            {copied ? (
              <Check className="w-2.5 h-2.5" />
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
            ID: {project.id.split("-")[0]}...
          </button>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 max-w-xl animate-in fade-in slide-in-from-left-2 duration-200">
            <Input
              ref={inputRef}
              data-testid="project-rename-input"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="text-2xl font-bold h-12 bg-white border-slate-200 shadow-sm"
            />
            <Button
              size="icon"
              data-testid="project-rename-save"
              variant="primary"
              className="h-10 w-10 shrink-0"
              onClick={handleSave}
            >
              <Check className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 bg-white border-slate-200"
              onClick={handleCancel}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="group flex items-center gap-3 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4 rounded-xl transition-all"
            data-testid="project-name-display"
            onClick={() => setIsEditing(true)}
            aria-label={`Rename project: ${project.name}`}
            title="Click to rename project"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors break-words">
              {project.name}
            </h1>
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-all group-hover:text-teal-600 group-hover:bg-teal-50 shadow-sm group-active:scale-95">
              <Pencil className="w-4 h-4" />
            </div>
          </button>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          className="bg-white gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
          type="button"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="w-4 h-4 shrink-0" aria-hidden />
          Share project view
        </Button>
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          projectId={project.id}
        />
        <Link
          to="/dashboard/execute"
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-900 focus-visible:ring-offset-2 active:scale-[0.98]",
            "liquid-metal-button text-white hover:shadow-lg hover:shadow-teal-500/10",
            "h-10 px-5 rounded-xl shadow-sm w-full sm:w-auto",
          )}
          onClick={() => {
            window.setTimeout(() => {
              document.getElementById("dashboard-phase-nav")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 150);
          }}
        >
          <FilePlus2 className="w-4 h-4 shrink-0" aria-hidden />
          Add document
        </Link>
      </div>
    </div>
  );
});
