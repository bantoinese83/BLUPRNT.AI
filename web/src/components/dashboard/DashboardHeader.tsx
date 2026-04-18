import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings2, FileDown, LifeBuoy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/utils";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";

type DashboardHeaderProps = {
  onSignOut: () => void;
  projectName?: string;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  onExportPDF?: () => void;
  onOpenInsights?: () => void;
};

export function DashboardHeader({
  onSignOut,
  projectName,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
  onExportPDF,
  onOpenInsights,
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
          <Link
            to="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-md ring-1 ring-slate-200/50 transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:h-11 sm:w-11"
            aria-label="BLUPRNT — Dashboard home"
          >
            <img
              src="/bluprnt_logo.svg"
              alt=""
              className="h-full w-full object-contain"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-x-2 gap-y-1">
              <Link
                to="/dashboard"
                className="text-base font-black italic tracking-tight text-slate-900 sm:text-lg"
              >
                BLUPRNT<span className="text-teal-600">.AI</span>
              </Link>
              {isArchitect ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 py-0.5 pl-1 pr-2 text-[10px] font-black uppercase tracking-wider text-teal-700 ring-1 ring-teal-100"
                  title="Pro subscription (Architect tier)—full app access for homeowners"
                >
                  <ArchitectPlanIcon
                    className="h-4 w-4"
                    title="Pro plan, Architect tier"
                  />
                  Pro
                </span>
              ) : hasProjectPass ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 py-0.5 pl-1 pr-2 text-[10px] font-black uppercase tracking-wider text-slate-700 ring-1 ring-slate-100">
                  <ProjectPassIcon className="h-4 w-4" />
                  Project Pass
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Breadcrumbs
                projectName={projectName}
                className="mt-0.5 text-xs sm:text-sm"
              />
              {projectName && (
                <div className="hidden items-center gap-1.5 sm:flex">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                    Live Sync
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-1.5"
          aria-label="Account and project actions"
        >
          <Link
            to="/onboarding"
            className="shrink-0"
            aria-label="Start a BLUPRNT"
            title="Start a BLUPRNT"
          >
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/90 hover:text-teal-900 sm:px-3">
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Start a BLUPRNT</span>
            </span>
          </Link>

          {onOpenInsights && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2 text-slate-600 hover:bg-teal-50 hover:text-teal-600 sm:px-3"
              onClick={onOpenInsights}
              type="button"
              aria-label="Insights"
            >
              <img
                src="/insights-icon.svg"
                alt=""
                className="h-5 w-5 sm:mr-1.5 shrink-0"
                aria-hidden
              />
              <span className="hidden font-semibold sm:inline">Insights</span>
            </Button>
          )}

          <span
            className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block"
            aria-hidden
          />

          {projectName && onExportPDF ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2 text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 sm:px-3"
              onClick={onExportPDF}
              type="button"
              title="Download seller packet PDF"
              aria-label="Download seller packet PDF"
            >
              <FileDown
                className="h-4 w-4 text-slate-500 sm:mr-1.5"
                aria-hidden
              />
              <span className="hidden font-semibold sm:inline">
                Export packet
              </span>
              {!isArchitect && (
                <span className="ml-1.5 hidden rounded-md bg-teal-950 px-1 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white sm:inline">
                  Pro
                </span>
              )}
            </Button>
          ) : null}

          {!isArchitect && onUpgradeClick ? (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-900 transition-colors hover:bg-teal-50/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:h-14 sm:w-14"
              aria-label="Upgrade plan"
            >
              <img
                src="/upgrade-icon.svg"
                alt=""
                className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
                aria-hidden
              />
            </button>
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

          <Link to="/settings" className="block">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100/90"
              type="button"
            >
              <Settings2
                className="h-4 w-4 text-slate-500 lg:mr-1.5"
                aria-hidden
              />
              <span className="hidden font-semibold lg:inline">Settings</span>
            </Button>
          </Link>

          <a href="mailto:connect@monarch-labs.com" className="block">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100/90 hover:text-teal-600"
              type="button"
            >
              <LifeBuoy className="h-4 w-4 lg:mr-1.5" aria-hidden />
              <span className="hidden font-semibold lg:inline">Support</span>
            </Button>
          </a>

          <span
            className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block"
            aria-hidden
          />

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
