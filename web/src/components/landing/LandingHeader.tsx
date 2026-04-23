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

export function LandingHeader() {
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
          className="flex h-16 items-center justify-between gap-3 sm:h-17"
          aria-label="Main navigation"
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0 shrink"
          >
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2.5 rounded-xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 sm:gap-3"
              aria-label="BLUPRNT — Home"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-0.5 shadow-md ring-1 ring-slate-200/40 sm:h-14 sm:w-14 sm:rounded-2xl sm:p-1">
                <img
                  src="/bluprnt_logo.webp"
                  alt="BLUPRNT.AI Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="truncate pr-1 text-lg font-black italic tracking-tighter text-slate-900 sm:text-xl">
                BLUPRNT
                <span className="text-teal-600" style={{ color: "#086960" }}>
                  .AI
                </span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop in-page links */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 hidden -translate-x-1/2 lg:flex lg:items-center lg:gap-0.5"
          >
            {navLinks.map(([id, label]) => (
              <Link
                key={id}
                to={`/#${id}`}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
              >
                {label}
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className="flex shrink-0 items-center gap-1.5 sm:gap-2.5"
          >
            {user ? (
              <Link to="/dashboard" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-2 font-bold text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-all shadow-sm"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-slate-800 hover:bg-slate-100 hover:text-slate-900 font-semibold"
                >
                  <LogIn className="mr-1.5 h-4 w-4" aria-hidden />
                  <span className="hidden lg:inline">Sign in</span>
                </Button>
              </Link>
            )}

            <Link to="/onboarding" className="flex">
              <Button
                size="sm"
                className="rounded-xl premium-gradient border-0 px-4 py-2 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm font-bold sm:px-5"
              >
                <span className="hidden xs:inline">Get started</span>
                <span className="xs:hidden">Start</span>
                <ArrowRight
                  className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4"
                  aria-hidden
                />
              </Button>
            </Link>

            <button
              type="button"
              className="relative z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="landing-mobile-nav"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              <AnimatePresence mode="wait">
                {mobileNavOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" aria-hidden />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </nav>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.div
                id="landing-mobile-nav"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-50 w-[min(85vw,380px)] bg-white shadow-2xl lg:hidden flex flex-col"
              >
                <div className="flex h-16 items-center border-b border-slate-100 px-6 sm:h-[4.25rem]">
                  <span className="text-lg font-black italic tracking-tighter text-slate-900">
                    BLUPRNT<span className="text-teal-600">.AI</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Navigation
                    </p>
                    {navLinks.map(([id, label], idx) => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                      >
                        <Link
                          to={`/#${id}`}
                          onClick={() => setMobileNavOpen(false)}
                          className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-teal-600"
                        >
                          {label}
                          <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  <div className="my-8 border-t border-slate-100" />

                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Account
                    </p>
                    {user ? (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-4 text-base font-bold text-teal-700 shadow-sm"
                          onClick={() => setMobileNavOpen(false)}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-teal-200/50">
                            <LayoutDashboard className="h-5 w-5" aria-hidden />
                          </div>
                          Dashboard
                        </Link>
                      </motion.div>
                    ) : (
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Link
                            to="/login"
                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => setMobileNavOpen(false)}
                          >
                            <LogIn
                              className="h-5 w-5 text-slate-400"
                              aria-hidden
                            />
                            Sign in
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 }}
                        >
                          <Link
                            to="/register"
                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => setMobileNavOpen(false)}
                          >
                            <UserPlus
                              className="h-5 w-5 text-slate-400"
                              aria-hidden
                            />
                            Create account
                          </Link>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <Link
                    to="/onboarding"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Button className="h-14 w-full rounded-2xl premium-gradient font-black text-lg shadow-xl shadow-teal-500/20 active:scale-[0.98] transition-transform">
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                    </Button>
                  </Link>
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Join 2,000+ homeowners today.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
