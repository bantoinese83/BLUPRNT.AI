import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings2, FileDown, LifeBuoy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  onSignOut: () => void;
  projectName?: string;
  isArchitect?: boolean;
  onUpgradeClick?: () => void;
  onExportPDF?: () => void;
};

export function DashboardHeader({
  onSignOut,
  projectName,
  isArchitect,
  onUpgradeClick,
  onExportPDF,
}: DashboardHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-shadow duration-300",
        scrolled && "shadow-sm shadow-slate-200/40",
      )}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
          <Link
            to="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-md ring-1 ring-slate-200/50 transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:h-11 sm:w-11"
            aria-label="BLUPRNT — Dashboard home"
          >
            <img src="/bluprnt_logo.svg" alt="" className="h-full w-full object-contain" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Link
                to="/dashboard"
                className="truncate text-base font-black italic tracking-tighter text-slate-900 sm:text-lg"
              >
                BLUPRNT<span className="text-indigo-600">.AI</span>
              </Link>
              {isArchitect ? (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-100">
                  Architect
                </span>
              ) : null}
            </div>
            <Breadcrumbs projectName={projectName} className="mt-0.5 text-xs sm:text-sm" />
          </div>
        </div>

        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-1.5"
          aria-label="Account and project actions"
        >
          <Link
            to="/onboarding"
            className="shrink-0"
            aria-label="Start new project"
            title="Start new project"
          >
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/90 hover:text-indigo-900 sm:px-3">
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">New project</span>
            </span>
          </Link>

          <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />

          {projectName && onExportPDF ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2 text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 sm:px-3"
              onClick={onExportPDF}
              type="button"
            >
              <FileDown className="h-4 w-4 text-slate-500 sm:mr-1.5" aria-hidden />
              <span className="hidden font-semibold sm:inline">Export</span>
            </Button>
          ) : null}

          {!isArchitect && onUpgradeClick ? (
            <Button
              variant="primary"
              size="sm"
              className="h-9 rounded-xl px-3 text-xs font-bold shadow-md shadow-indigo-500/15 sm:text-sm premium-gradient"
              onClick={onUpgradeClick}
              type="button"
            >
              <UpgradeIcon className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Upgrade
            </Button>
          ) : null}

          {isArchitect && onUpgradeClick ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 bg-white/80 px-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-white sm:hidden"
                onClick={onUpgradeClick}
                type="button"
              >
                Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden h-9 rounded-xl border-slate-200 bg-white/80 font-semibold text-slate-800 shadow-sm hover:bg-white sm:inline-flex"
                onClick={onUpgradeClick}
                type="button"
              >
                Manage plan
              </Button>
            </>
          ) : null}

          <span
            className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block"
            aria-hidden
          />

          <Link to="/settings" className="sm:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-600" type="button" aria-label="Settings">
              <Settings2 className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <a href="mailto:connect@monarch-labs.com" className="sm:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-600" type="button" aria-label="Contact support">
              <LifeBuoy className="h-4 w-4" aria-hidden />
            </Button>
          </a>

          <Link to="/settings" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100/90"
              type="button"
            >
              <Settings2 className="mr-1.5 h-4 w-4 text-slate-500" aria-hidden />
              <span className="font-semibold">Settings</span>
            </Button>
          </Link>

          <a href="mailto:connect@monarch-labs.com" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100/90 hover:text-indigo-600"
              type="button"
            >
              <LifeBuoy className="mr-1.5 h-4 w-4" aria-hidden />
              <span className="font-semibold">Support</span>
            </Button>
          </a>

          <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />

          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl px-2 text-slate-600 hover:bg-rose-50 hover:text-rose-700 sm:px-2.5"
            onClick={onSignOut}
            type="button"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 opacity-80 sm:mr-1.5" aria-hidden />
            <span className="hidden font-semibold sm:inline">Sign out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
