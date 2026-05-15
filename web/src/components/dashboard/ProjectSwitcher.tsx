import { useState, useRef, useEffect, memo, useId } from "react";
import { Link } from "react-router-dom";
import { Archive, ChevronDown, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { getProjectIcon } from "@/lib/onboarding-icons";

type ProjectOption = {
  id: string;
  name: string;
  archived?: boolean;
  created_at?: string;
  estimated_min_total?: number | null;
};

export const ProjectSwitcher = memo(function ProjectSwitcher({
  projects,
  currentId,
  onSelect,
  onDelete,
  onArchive,
  disabled,
}: {
  projects: ProjectOption[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onArchive?: (id: string, archived: boolean) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen((wasOpen) => {
        if (wasOpen) {
          queueMicrotask(() => toggleRef.current?.focus());
        }
        return false;
      });
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const current = projects.find((p) => p.id === currentId);
  const label = current?.name ?? "Select project";

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const visibleProjects = showArchived ? projects : activeProjects;

  const newProjectButton = (
    <Link
      to="/onboarding"
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50/80 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:px-4"
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      <span>Start a BLUPRNT</span>
    </Link>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
      <div ref={ref} className="relative min-w-0 flex-1">
        <Button
          ref={toggleRef}
          variant="outline"
          data-testid="project-switcher-toggle"
          className={`h-11 min-w-0 max-w-full gap-2.5 rounded-2xl border-slate-200/80 bg-white px-4 shadow-sm transition-all hover:border-slate-400 hover:shadow-md group sm:min-w-[160px] sm:max-w-[280px] ${open ? "border-slate-950 ring-2 ring-slate-950/20" : ""}`}
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={`Choose project. Current: ${label}.`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${open ? "bg-teal-500/20" : "bg-teal-500/10 group-hover:bg-teal-500/20"}`}
          >
            {getProjectIcon(label)({
              className: "w-3.5 h-3.5 object-contain opacity-100",
            })}
          </div>
          <span className="min-w-0 truncate font-bold text-slate-700">
            {label}
            {current?.archived && (
              <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                Archived
              </span>
            )}
          </span>
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-slate-950" : "text-slate-600"}`}
            aria-hidden
          />
        </Button>

        <AnimatePresence>
          {open && (
            <motion.div
              id={listboxId}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 top-full z-50 mt-2 w-full min-w-[280px] max-w-[min(100vw-2rem,360px)] rounded-[1.25rem] border border-slate-200 bg-white py-2 shadow-2xl"
              role="listbox"
              aria-label="Your projects"
            >
              <div className="px-3 pb-2 mb-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  Your Projects
                </span>
                {archivedProjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {showArchived ? (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Hide Archived
                        </span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Show Archived
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto px-1">
                {visibleProjects.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs font-medium text-slate-400">
                      No active projects.
                    </p>
                  </div>
                ) : (
                  visibleProjects.map((p) => {
                    const isActive = p.id === currentId;
                    return (
                      <div
                        key={p.id}
                        className="relative flex items-center group px-1 mb-1"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-xl transition-all ${
                            isActive
                              ? "bg-teal-500/10 text-teal-900 font-bold ring-1 ring-teal-500/20"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          } ${p.archived ? "opacity-60" : ""}`}
                          onClick={() => {
                            onSelect(p.id);
                            setOpen(false);
                          }}
                          data-testid={`project-option-${p.name}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-white/40 shadow-sm" : "bg-teal-500/10 ring-1 ring-teal-500/20 group-hover:bg-teal-500/20"}`}
                          >
                            {getProjectIcon(p.name)({
                              className: `w-4 h-4 object-contain transition-all ${isActive ? "opacity-100" : "opacity-90"}`,
                            })}
                          </div>

                          <div className="flex flex-col min-w-0 pr-12">
                            <span className="truncate flex items-center gap-1.5">
                              {p.name}
                              {p.archived && (
                                <Archive className="w-3 h-3 text-slate-400" />
                              )}
                            </span>
                            <span
                              className={`text-[11px] truncate uppercase tracking-tight ${isActive ? "text-teal-600/80" : "text-slate-400"}`}
                            >
                              {p.created_at
                                ? new Date(p.created_at).toLocaleDateString(
                                    undefined,
                                    {
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : ""}
                              {p.estimated_min_total
                                ? ` • $${Math.round(p.estimated_min_total / 1000)}k`
                                : " • Planning"}
                            </span>
                          </div>
                        </button>

                        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {onArchive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchive(p.id, !p.archived);
                              }}
                              className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                              aria-label={
                                p.archived
                                  ? "Restore project"
                                  : "Archive project"
                              }
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(p.id);
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              aria-label={`Delete project ${p.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-slate-100 px-2 pt-2">
                <Link
                  to="/onboarding"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-50"
                  onClick={() => setOpen(false)}
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Start a BLUPRNT
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {newProjectButton}
    </div>
  );
});
