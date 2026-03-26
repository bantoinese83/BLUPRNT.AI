import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, X, ArrowRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const autoOpenDone = useRef(
    sessionStorage.getItem("bluprnt_help_auto") === "true",
  );

  // Hide the widget on Landing, Login, Register, Onboarding flows where it might distract
  // Show it primarily in the Dashboard and Settings.
  const hiddenPaths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/auth/reset-password",
  ];
  const isHidden =
    hiddenPaths.includes(location.pathname) ||
    location.pathname.startsWith("/onboarding");

  // Auto-open after 60s on first dashboard visit (once per session)
  useEffect(() => {
    if (isHidden || autoOpenDone.current) return;

    const timer = setTimeout(() => {
      setShowPulse(true);
      setIsOpen(true);
      autoOpenDone.current = true;
      sessionStorage.setItem("bluprnt_help_auto", "true");
    }, 60_000);

    // Show pulse indicator after 15s
    const pulseTimer = setTimeout(() => {
      if (!autoOpenDone.current) setShowPulse(true);
    }, 15_000);

    return () => {
      clearTimeout(timer);
      clearTimeout(pulseTimer);
    };
  }, [isHidden]);

  if (isHidden) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 right-6 sm:right-8 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden"
          >
            <div className="bg-slate-900 p-4 text-white relative">
              <h4 className="font-bold text-lg mb-1">Hello there! 👋</h4>
              <p className="text-sm text-slate-300">
                How can we help you today?
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Close help"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <h5 className="text-sm font-semibold text-slate-900">
                  Command bar
                </h5>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Press{" "}
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 shadow-sm">
                    ⌘K
                  </kbd>{" "}
                  on Mac or{" "}
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 shadow-sm">
                    Ctrl+K
                  </kbd>{" "}
                  on Windows to open quick actions. Choose{" "}
                  <span className="font-semibold text-slate-800">
                    Create New Project
                  </span>{" "}
                  to run the estimate flow for another remodel.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/#faq");
                }}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors group text-left"
              >
                <div>
                  <h5 className="font-semibold text-indigo-900 text-sm">
                    Visit FAQ
                  </h5>
                  <p className="text-xs text-indigo-600/70 mt-0.5">
                    Common questions answered
                  </p>
                </div>
                <HelpCircle className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <a
                href="mailto:connect@monarch-labs.com?subject=Need%20Help%20with%20BLUPRNT"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div>
                  <h5 className="font-semibold text-slate-900 group-hover:text-indigo-900 text-sm">
                    Contact Support
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Email our friendly team
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors group-hover:translate-x-0.5" />
              </a>

              <a
                href="mailto:connect@monarch-labs.com?subject=BLUPRNT%20Feedback"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div>
                  <h5 className="font-semibold text-slate-900 text-sm">
                    Share Feedback
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Got an idea? Let us know!
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors group-hover:translate-x-0.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPulse(false);
        }}
        className="fixed bottom-6 right-6 sm:right-8 z-50 flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-900/20 hover:bg-indigo-600 transition-colors duration-300"
        aria-label="Help and Support"
      >
        <MessageCircle className="w-6 h-6" />
        {showPulse && !isOpen && (
          <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm border-2 border-slate-900 ring-1 ring-indigo-400/20">
            <HelpCircle className="w-2.5 h-2.5" />
          </div>
        )}
      </motion.button>
    </>
  );
}
