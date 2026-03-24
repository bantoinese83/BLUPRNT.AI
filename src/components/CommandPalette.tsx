import * as React from "react";
import { useState, useEffect, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { 
  Search, 
  Plus, 
  Settings, 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Zap,
  LogOut,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .order("updated_at", { ascending: false })
      .limit(5);
    if (data) setProjects(data);
  }, []);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        fetchProjects();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, fetchProjects]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden glass-dark border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl"
          >
            <Command className="flex flex-col h-full focus-within:outline-none">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
                <Search className="w-5 h-5 text-slate-500" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or search projects..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg font-medium"
                  value={search}
                  onValueChange={setSearch}
                />
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[10px] font-black text-slate-400">
                  <span className="text-xs">ESC</span>
                </div>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-3 scrollbar-hide">
                <Command.Empty className="py-12 text-center text-slate-500">
                  <div className="space-y-2">
                    <Search className="w-10 h-10 mx-auto opacity-20" />
                    <p className="text-sm font-medium">No results found for "{search}"</p>
                  </div>
                </Command.Empty>

                <Command.Group heading="Essentials" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">
                  <Item icon={<LayoutDashboard />} label="Dashboard" shortcut="G D" onSelect={() => runCommand(() => navigate("/dashboard"))} />
                  <Item icon={<Plus />} label="Create New Project" shortcut="N" onSelect={() => runCommand(() => navigate("/onboarding"))} />
                  <Item icon={<Settings />} label="Account Settings" shortcut="S" onSelect={() => runCommand(() => navigate("/settings"))} />
                </Command.Group>

                <div className="h-px bg-slate-800/30 my-2 mx-3" />

                {projects.length > 0 && (
                  <Command.Group heading="Recent Projects" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">
                    {projects.map(p => (
                      <Item 
                        key={p.id} 
                        icon={<FileText />} 
                        label={p.name} 
                        onSelect={() => runCommand(() => {
                           localStorage.setItem("bluprnt_project_id", p.id);
                           navigate("/dashboard");
                           window.dispatchEvent(new Event('storage')); // Trigger reload
                        })} 
                      />
                    ))}
                  </Command.Group>
                )}

                <div className="h-px bg-slate-800/30 my-2 mx-3" />

                <Command.Group heading="System" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">
                   <Item icon={<Shield />} label="Privacy Policy" onSelect={() => runCommand(() => navigate("/privacy"))} />
                   <Item icon={<LogOut className="text-rose-400" />} label="Sign Out" onSelect={() => runCommand(async () => {
                      await supabase.auth.signOut();
                      navigate("/onboarding");
                   })} />
                </Command.Group>
              </Command.List>

              <div className="px-6 py-4 bg-slate-900/40 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Active</span>
                  <span className="flex items-center gap-2 underline decoration-slate-700 underline-offset-4">v0.1.0-alpha</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Powered by BLUPRNT AI
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Item({ 
  icon, 
  label, 
  shortcut, 
  onSelect 
}: { 
  icon: React.ReactNode; 
  label: string; 
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex items-center justify-between px-3 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 group outline-none",
        "aria-selected:bg-white/5 aria-selected:translate-x-1"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800/40 flex items-center justify-center text-slate-400 group-aria-selected:bg-white group-aria-selected:text-slate-950 transition-colors shadow-sm border border-slate-700/30">
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<{ className?: string; strokeWidth?: number }>, { 
                className: "w-5 h-5", 
                strokeWidth: 2.5 
              })
            : icon}
        </div>

        <span className="text-sm font-bold text-slate-300 group-aria-selected:text-white">{label}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {shortcut && (
          <div className="flex items-center gap-1">
            {shortcut.split(" ").map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-[10px] font-black text-slate-500 group-aria-selected:text-slate-300">
                {s}
              </span>
            ))}
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-aria-selected:opacity-100 transition-all translate-x-[-10px] group-aria-selected:translate-x-0" />
      </div>
    </Command.Item>
  );
}
