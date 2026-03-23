import { useState, useRef, useEffect } from "react";
import { ChevronDown, FolderOpen, Trash2 } from "lucide-react";
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

  if (projects.length <= 1 && !onDelete) {
    return (
      <div className="flex items-center gap-2.5 text-slate-700 bg-white/50 border border-slate-200/60 px-4 py-2 rounded-2xl shadow-sm">
        <FolderOpen className="w-4 h-4 text-slate-900 shrink-0" aria-hidden />
        <span className="font-bold text-sm truncate max-w-[180px]">{label}</span>
      </div>

    );
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        className={`gap-2.5 min-w-[160px] max-w-[240px] h-11 px-4 rounded-2xl border-slate-200/80 bg-white shadow-sm transition-all hover:border-slate-400 hover:shadow-md group ${open ? 'ring-2 ring-slate-950/20 border-slate-950' : ''}`}

        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        type="button"
        aria-expanded={open}
      >
        <FolderOpen className={`w-4 h-4 shrink-0 transition-colors ${open ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden />
        <span className="truncate font-bold text-slate-700">{label}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 ml-auto transition-transform duration-300 ${open ? "rotate-180 text-slate-950" : "text-slate-400"}`}

          aria-hidden
        />
      </Button>

      {open && (
        <div 
          className="absolute top-full left-0 mt-2 w-full min-w-[260px] max-w-[320px] rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          <div className="px-3 pb-2 mb-2 border-b border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Your Projects</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto px-1">
            {projects.map((p) => {
              const isActive = p.id === currentId;
              return (
                <div key={p.id} className="relative flex items-center group px-1 mb-1">
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
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-white scale-100' : 'bg-transparent scale-0 group-hover:bg-slate-300 group-hover:scale-100'}`} />

                    <span className="truncate">{p.name}</span>
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
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
        </div>
      )}
    </div>
  );
}
