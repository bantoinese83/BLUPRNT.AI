import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, FolderOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProjectOption = {
  id: string;
  name: string;
};

export function ProjectSwitcher({
  projects,
  currentId,
  onSelect,
  onDelete,
  disabled,
}: {
  projects: ProjectOption[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = projects.find((p) => p.id === currentId);
  const label = current?.name ?? "Select project";

  const newProjectButton = (
    <Link
      to="/onboarding"
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:px-4"
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      <span>Start a BLUPRNT</span>
    </Link>
  );

  if (projects.length <= 1 && !onDelete) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200/60 bg-white/50 px-4 py-2 text-slate-700 shadow-sm">
          <FolderOpen className="h-4 w-4 shrink-0 text-slate-900" aria-hidden />
          <span className="truncate text-sm font-bold">{label}</span>
        </div>
        {newProjectButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
      <div ref={ref} className="relative min-w-0 flex-1">
        <Button
          variant="outline"
          className={`h-11 min-w-0 max-w-full gap-2.5 rounded-2xl border-slate-200/80 bg-white px-4 shadow-sm transition-all hover:border-slate-400 hover:shadow-md group sm:min-w-[160px] sm:max-w-[280px] ${open ? "border-slate-950 ring-2 ring-slate-950/20" : ""}`}
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          type="button"
          aria-expanded={open}
        >
          <FolderOpen
            className={`h-4 w-4 shrink-0 transition-colors ${open ? "text-slate-950" : "text-slate-400 group-hover:text-slate-600"}`}
            aria-hidden
          />
          <span className="min-w-0 truncate font-bold text-slate-700">
            {label}
          </span>
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-slate-950" : "text-slate-400"}`}
            aria-hidden
          />
        </Button>

        {open && (
          <div
            className="animate-in fade-in slide-in-from-top-2 absolute left-0 top-full z-50 mt-2 w-full min-w-[260px] max-w-[min(100vw-2rem,320px)] rounded-[1.25rem] border border-slate-200 bg-white py-2 shadow-2xl duration-200"
            role="listbox"
          >
            <div className="px-3 pb-2 mb-2 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                Your Projects
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto px-1">
              {projects.map((p) => {
                const isActive = p.id === currentId;
                return (
                  <div
                    key={p.id}
                    className="relative flex items-center group px-1 mb-1"
                  >
                    <button
                      type="button"
                      className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-xl transition-all ${
                        isActive
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      onClick={() => {
                        onSelect(p.id);
                        setOpen(false);
                      }}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "bg-white scale-100" : "bg-transparent scale-0 group-hover:bg-slate-300 group-hover:scale-100"}`}
                      />

                      <span className="truncate">{p.name}</span>
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Are you sure you want to delete "${p.name}"?`,
                            )
                          ) {
                            onDelete(p.id);
                          }
                        }}
                        className="absolute right-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Delete project ${p.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-100 px-2 pt-2">
              <Link
                to="/onboarding"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
                onClick={() => setOpen(false)}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Start a BLUPRNT
              </Link>
            </div>
          </div>
        )}
      </div>
      {newProjectButton}
    </div>
  );
}
