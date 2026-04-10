import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FilePlus2,
  Share2,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareModal } from "./ShareModal";
import { Input } from "@/components/ui/input";

import type { ProjectRow } from "@shared/types/database";

interface ProjectHeaderProps {
  project: ProjectRow;
  onRename?: (newName: string) => void;
}

export function ProjectHeader({ project, onRename }: ProjectHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(project.name);
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

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-teal-950 text-white border-teal-900 gap-1.5 font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
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
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 max-w-xl animate-in fade-in slide-in-from-left-2 duration-200">
            <Input
              ref={inputRef}
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
          <div
            className="group flex items-center gap-3 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
              {project.name}
            </h1>
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-brand-primary hover:bg-brand-primary/5">
              <Pencil className="w-4 h-4" />
            </div>
          </div>
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
        <Link to="/dashboard/execute?type=quote">
          <Button
            variant="primary"
            type="button"
            className="rounded-xl shadow-sm w-full sm:w-auto px-5 h-10"
          >
            <FilePlus2 className="w-4 h-4 shrink-0" aria-hidden />
            Add quote
          </Button>
        </Link>
      </div>
    </div>
  );
}
