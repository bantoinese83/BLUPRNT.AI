import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LogIn,
  Menu,
  X,
  ArrowRight,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { useAuth } from "@/hooks/use-auth";

interface LandingHeaderProps {
  scrollToSection: (id: string) => void;
}

export function LandingHeader({ scrollToSection }: LandingHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const headerScrolled = useScrollPosition(8);
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setMobileNavOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const navLinks = [
    ["how", "How it works"],
    ["features", "Features"],
    ["pricing", "Pricing"],
    ["faq", "Questions"],
  ] as const;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ${
        headerScrolled ? "shadow-sm shadow-slate-200/50" : ""
      }`}
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <nav
          className="flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]"
          aria-label="Main navigation"
        >
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0 shrink"
          >
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2.5 rounded-xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 sm:gap-3"
              aria-label="BLUPRNT — Home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-md ring-1 ring-slate-200/40 sm:h-11 sm:w-11 sm:rounded-2xl sm:p-1.5">
                <img
                  src="/bluprnt_logo.svg"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="truncate pr-1 text-lg font-black italic tracking-tighter text-slate-900 sm:text-xl">
                BLUPRNT<span className="text-indigo-600">.AI</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop in-page links */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 hidden -translate-x-1/2 lg:flex lg:items-center lg:gap-0.5"
          >
            {navLinks.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
              >
                {label}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          >
            {user ? (
              <Link to="/dashboard" className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-2 font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogIn className="mr-1.5 h-4 w-4" aria-hidden />
                  Sign in
                </Button>
              </Link>
            )}

            <Link to="/onboarding" className="flex lg:hidden">
              <Button
                size="sm"
                variant="primary"
                className="rounded-xl px-3.5 text-xs font-bold shadow-md shadow-indigo-500/15"
              >
                Start
              </Button>
            </Link>

            <Link to="/onboarding" className="hidden lg:block">
              <Button
                size="sm"
                variant="primary"
                className="rounded-xl shadow-md shadow-indigo-500/20"
              >
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Button>
            </Link>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="landing-mobile-nav"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </motion.div>
        </nav>

        {/* Mobile panel */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              id="landing-mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200/80 bg-white/95 py-4 backdrop-blur-xl lg:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      scrollToSection(id);
                      setMobileNavOpen(false);
                    }}
                    className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    {label}
                  </button>
                ))}
                <div className="my-2 border-t border-slate-100" />
                {user ? (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <LogIn className="h-4 w-4 text-slate-500" aria-hidden />
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <UserPlus
                        className="h-4 w-4 text-slate-500"
                        aria-hidden
                      />
                      Create account
                    </Link>
                  </>
                )}
                <Link
                  to="/onboarding"
                  onClick={() => setMobileNavOpen(false)}
                  className="mt-2 px-1"
                >
                  <Button
                    variant="primary"
                    className="h-11 w-full rounded-xl font-bold shadow-md shadow-indigo-500/20"
                  >
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
