import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  Settings2,
  FileDown,
  LifeBuoy,
  Plus,
  Menu,
  X,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  onOpenAssistant?: () => void;
};

export function DashboardHeader({
  onSignOut,
  projectName,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
  onExportPDF,
  onOpenInsights,
  onOpenAssistant,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        "sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-2xl transition-all duration-300",
        scrolled && "shadow-spatial",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-17 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
          <Link
            to="/dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-0.5 shadow-sm ring-1 ring-slate-200/50 transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:h-14 sm:w-14 sm:rounded-2xl"
            aria-label="BLUPRNT — Dashboard home"
          >
            <img
              src="/bluprnt_logo.webp"
              alt=""
              className="h-full w-full object-contain"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-x-1.5 gap-y-1 sm:gap-x-2">
              <Link
                to="/dashboard"
                className="text-sm font-black italic tracking-tight text-slate-900 xs:text-base sm:text-lg"
              >
                BLUPRNT<span className="text-teal-600">.AI</span>
              </Link>
              {isArchitect ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 py-0.5 pl-1 pr-1.5 text-[9px] font-black uppercase tracking-wider text-teal-700 ring-1 ring-teal-100 sm:pr-2 sm:text-[10px]"
                  title="Architect subscription—full app access for homeowners"
                >
                  <ArchitectPlanIcon
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    title="Architect Plan"
                  />
                  <span className="hidden xs:inline">Architect</span>
                </span>
              ) : hasProjectPass ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 py-0.5 pl-1 pr-1.5 text-[9px] font-black uppercase tracking-wider text-slate-700 ring-1 ring-slate-100 sm:pr-2 sm:text-[10px]">
                  <ProjectPassIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Pass</span>
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Breadcrumbs
                projectName={projectName}
                className="mt-0.5 text-[10px] sm:text-xs"
              />
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
              <span className="hidden md:inline">Start a BLUPRNT</span>
              <span className="hidden sm:inline md:hidden">Start</span>
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

          {onOpenAssistant && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2 text-teal-600 hover:bg-teal-50 hover:text-teal-700 sm:px-3"
              onClick={onOpenAssistant}
              type="button"
              aria-label="Ask AI Assistant"
            >
              <Bot className="h-4 w-4 mr-1.5 shrink-0" aria-hidden />
              <span className="hidden font-bold sm:inline">Ask AI</span>
            </Button>
          )}

          <div className="hidden items-center gap-1 lg:flex">
            <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />

            {projectName && onExportPDF ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-3 text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                onClick={onExportPDF}
                type="button"
                title="Download Home Archive PDF"
                aria-label="Download Home Archive PDF"
              >
                <FileDown
                  className="h-4 w-4 text-slate-500 mr-1.5"
                  aria-hidden
                />
                <span className="font-semibold">Export Archive</span>
                {!isArchitect && (
                  <span className="ml-1.5 rounded-md bg-teal-950 px-1 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white">
                    Architect
                  </span>
                )}
              </Button>
            ) : null}

            {!isArchitect && onUpgradeClick ? (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-900 transition-colors hover:bg-teal-50/80 active:scale-[0.97]"
                aria-label="Upgrade plan"
              >
                <img
                  src="/upgrade-icon.svg"
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                  aria-hidden
                />
              </button>
            ) : null}

            {isArchitect && onUpgradeClick ? (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 bg-white/80 font-semibold text-slate-800 shadow-sm hover:bg-white"
                onClick={onUpgradeClick}
                type="button"
              >
                Manage plan
              </Button>
            ) : null}

            <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />

            <Link to="/settings" className="block">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100/90"
                type="button"
              >
                <Settings2
                  className="h-4 w-4 text-slate-500 mr-1.5"
                  aria-hidden
                />
                <span className="font-semibold">Settings</span>
              </Button>
            </Link>

            <a href="mailto:connect@monarch-labs.com" className="block">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100/90 hover:text-teal-600"
                type="button"
              >
                <LifeBuoy className="h-4 w-4 mr-1.5" aria-hidden />
                <span className="font-semibold">Support</span>
              </Button>
            </a>

            <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />

            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={onSignOut}
              type="button"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 opacity-80 mr-1.5" aria-hidden />
              <span className="font-semibold">Sign out</span>
            </Button>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[70] w-[min(80vw,320px)] bg-white shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex h-16 items-center border-b border-slate-100 px-6">
                <span className="text-base font-black italic tracking-tighter text-slate-900">
                  BLUPRNT<span className="text-teal-600">.AI</span>
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Project
                  </p>
                  {projectName && onExportPDF && (
                    <button
                      onClick={() => {
                        onExportPDF();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <FileDown className="h-5 w-5 text-slate-400" />
                      Export Archive
                    </button>
                  )}
                  {!isArchitect && onUpgradeClick && (
                    <button
                      onClick={() => {
                        onUpgradeClick();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700"
                    >
                      <img src="/upgrade-icon.svg" alt="" className="h-5 w-5" />
                      Upgrade to Architect
                    </button>
                  )}
                  {isArchitect && onUpgradeClick && (
                    <button
                      onClick={() => {
                        onUpgradeClick();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Settings2 className="h-5 w-5 text-slate-400" />
                      Manage Plan
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Settings
                  </p>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Settings2 className="h-5 w-5 text-slate-400" />
                    Account Settings
                  </Link>
                  <a
                    href="mailto:connect@monarch-labs.com"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <LifeBuoy className="h-5 w-5 text-slate-400" />
                    Contact Support
                  </a>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
