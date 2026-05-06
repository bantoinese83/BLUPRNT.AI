import * as React from "react";
import { useState, useEffect, useCallback, useRef, memo } from "react";

import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  Settings,
  LayoutDashboard,
  FileText,
  Shield,
  Cpu,
  LogOut,
  ChevronRight,
  ListTree,
  Scale,
  BookMarked,
  ScanLine,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { WEB_APP_PATH_PRIVACY } from "@shared/constants/public-site";
import { LEDGER_UPLOAD_ANCHOR_ID } from "@shared/constants/ui";

const paletteKbd = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    ? "⌘K"
    : "Ctrl+K";

const PROJECT_PALETTE_LIMIT = 40;

/** Strip `ilike` metacharacters from user input so patterns cannot be widened accidentally. */
function sanitizeIlikeUserFragment(value: string): string {
  return value.replace(/[%_\\]/g, "").trim();
}

export const CommandPalette = memo(function CommandPalette() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useFocusTrap(open, dialogRef);
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();

  const closePalette = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((wasOpen) => {
          if (wasOpen) setSearch("");
          return !wasOpen;
        });
      }
      if (e.key === "Escape") {
        closePalette();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [closePalette]);

  const fetchProjects = useCallback(async (query: string) => {
    const q = sanitizeIlikeUserFragment(query);
    let builder = supabase
      .from("projects")
      .select("id, name")
      .order("updated_at", { ascending: false })
      .limit(PROJECT_PALETTE_LIMIT);
    if (q.length > 0) {
      builder = builder.ilike("name", `%${q}%`);
    }
    const { data } = await builder;
    if (data) setProjects(data);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const delayMs = search.trim() ? 200 : 0;
    const id = window.setTimeout(() => {
      void fetchProjects(search);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [open, search, fetchProjects]);

  const runCommand = useCallback(
    (command: () => void) => {
      closePalette();
      command();
    },
    [closePalette],
  );

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => closePalette()}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            aria-hidden="true"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden glass-dark border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl"
          >
            <Command
              className="flex flex-col h-full focus-within:outline-none"
              label="Global command palette"
            >
              <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
                <Search className="w-5 h-5 text-slate-500" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or search projects..."
                  aria-label="Search commands and projects"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg font-medium"
                  value={search}
                  onValueChange={setSearch}
                />
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400">
                  <span
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    title="Open or close this palette"
                  >
                    <span className="text-xs" aria-hidden="true">
                      {paletteKbd()}
                    </span>
                  </span>
                  <span
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    title="Close"
                  >
                    <span className="text-xs">ESC</span>
                  </span>
                </div>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-3 scrollbar-hide">
                <Command.Empty className="py-12 text-center text-slate-500">
                  <div className="space-y-2">
                    <Search className="w-10 h-10 mx-auto opacity-20" />
                    <p className="text-sm font-medium">
                      No results found for "{search}"
                    </p>
                  </div>
                </Command.Empty>

                <Command.Group
                  heading="Essentials"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2"
                >
                  <Item
                    icon={<LayoutDashboard />}
                    label="Dashboard"
                    value="dashboard home"
                    shortcut="G D"
                    onSelect={() => runCommand(() => navigate("/dashboard"))}
                  />
                  <Item
                    icon={<Plus />}
                    label="Create New Project"
                    value="new project onboarding"
                    shortcut="N"
                    onSelect={() => runCommand(() => navigate("/onboarding"))}
                  />
                  <Item
                    icon={<Settings />}
                    label="Account Settings"
                    value="settings account profile billing"
                    shortcut="S"
                    onSelect={() => runCommand(() => navigate("/settings"))}
                  />
                </Command.Group>

                <Command.Group
                  heading="This project"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2"
                >
                  <Item
                    icon={<LayoutDashboard />}
                    label="Plan & documents"
                    value="plan documents vault upload invoices"
                    onSelect={() =>
                      runCommand(() => navigate("/dashboard/plan"))
                    }
                  />
                  <Item
                    icon={<ListTree />}
                    label="Scope line items"
                    value="scope renovation line items"
                    onSelect={() =>
                      runCommand(() => navigate("/dashboard/scope"))
                    }
                  />
                  <Item
                    icon={<Scale />}
                    label="Budget vs actual"
                    value="budget execute actual spend"
                    onSelect={() =>
                      runCommand(() => navigate("/dashboard/execute"))
                    }
                  />
                  <Item
                    icon={<BookMarked />}
                    label="Property record"
                    value="property record home details"
                    onSelect={() =>
                      runCommand(() => navigate("/dashboard/record"))
                    }
                  />
                  <Item
                    icon={<ScanLine />}
                    label="Jump to ledger upload"
                    value="ledger upload scan document bill receipt"
                    onSelect={() =>
                      runCommand(() => {
                        navigate("/dashboard/plan");
                        window.requestAnimationFrame(() => {
                          document
                            .getElementById(LEDGER_UPLOAD_ANCHOR_ID)
                            ?.scrollIntoView({ behavior: "smooth" });
                        });
                      })
                    }
                  />
                </Command.Group>

                <div className="h-px bg-slate-800/30 my-2 mx-3" />

                {projects.length > 0 && (
                  <Command.Group
                    heading={
                      search.trim() ? "Matching projects" : "Recent projects"
                    }
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2"
                  >
                    {projects.map((p) => (
                      <Item
                        key={p.id}
                        icon={<FileText />}
                        label={p.name}
                        value={`${p.name} ${p.id} project`}
                        onSelect={() =>
                          runCommand(() => {
                            localStorage.setItem("bluprnt_project_id", p.id);
                            navigate("/dashboard");
                            window.dispatchEvent(new Event("storage")); // Trigger reload
                          })
                        }
                      />
                    ))}
                  </Command.Group>
                )}

                <div className="h-px bg-slate-800/30 my-2 mx-3" />

                <Command.Group
                  heading="System"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2"
                >
                  <Item
                    icon={<Shield />}
                    label="Privacy Policy"
                    value="privacy legal"
                    onSelect={() =>
                      runCommand(() => navigate(WEB_APP_PATH_PRIVACY))
                    }
                  />
                  <Item
                    icon={<LogOut className="text-rose-400" />}
                    label="Sign Out"
                    value="sign out logout leave"
                    onSelect={() =>
                      runCommand(async () => {
                        await supabase.auth.signOut();
                        navigate("/onboarding");
                      })
                    }
                  />
                </Command.Group>
              </Command.List>

              <div className="px-6 py-4 bg-slate-900/40 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                    System Active
                  </span>
                  <span className="flex items-center gap-2 underline decoration-slate-700 underline-offset-4">
                    v0.1.0-alpha
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Cpu className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Powered by BLUPRNT AI
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const Item = memo(
  ({
    icon,
    label,
    value,
    shortcut,
    onSelect,
  }: {
    icon: React.ReactNode;
    label: string;
    /** Optional cmdk filter string (defaults to `label`). */
    value?: string;
    shortcut?: string;
    onSelect: () => void;
  }) => {
    return (
      <Command.Item
        value={value ?? label}
        onSelect={onSelect}
        className={cn(
          "flex items-center justify-between px-3 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 group outline-none",
          "aria-selected:bg-white/5 aria-selected:translate-x-1",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800/50 text-slate-400 group-aria-selected:bg-amber-500/10 group-aria-selected:text-amber-400 transition-colors">
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200 group-aria-selected:text-white transition-colors">
              {label}
            </span>
            {shortcut && (
              <span className="text-[10px] font-medium text-slate-500">
                {shortcut}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {shortcut && (
            <div className="hidden sm:flex items-center gap-1">
              {shortcut.split(" ").map((key, i) => (
                <kbd
                  key={i}
                  className="px-1.5 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50 text-[9px] font-black text-slate-500"
                >
                  {key}
                </kbd>
              ))}
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-aria-selected:opacity-100 transition-all translate-x-[-10px] group-aria-selected:translate-x-0" />
        </div>
      </Command.Item>
    );
  },
);
