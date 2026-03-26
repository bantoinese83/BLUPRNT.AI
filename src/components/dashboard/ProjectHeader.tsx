import { useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Share2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareModal } from "./ShareModal";

import type { ProjectRow } from "@/types/database";

export function ProjectHeader({ project }: { project: ProjectRow }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-slate-900 text-white border-slate-800 gap-1.5 font-medium"
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
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {project.name}
        </h1>
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
