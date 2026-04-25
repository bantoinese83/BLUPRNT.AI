import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Loader } from "@/components/ui/Loader";
import { loadingScreenMessages } from "@shared/constants/onboarding";

export function LoadingScreen() {
  const { onboardingContext, fetchOnboardingContext } = useOnboarding();
  const navigate = useNavigate();
  const [messageIdx, setMessageIdx] = useState(0);

  const staticMessages = useMemo(
    () => loadingScreenMessages(projectType, locationInput),
    [projectType, locationInput],
  );

  const activeMessages = onboardingContext?.status_messages || staticMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % activeMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeMessages.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Trigger both in parallel: one for the "busy work" (fast), one for the "real work" (slow)
      void fetchOnboardingContext();
      await runPhotoToScope();

      // Brief beat so the route transition doesn’t feel abrupt after a fast response
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (cancelled) return;
      navigate("/onboarding/estimate", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [runPhotoToScope, fetchOnboardingContext]);

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[50vh]">
        <div className="relative mb-8">
          <Loader
            title="Building your BLUPRNT"
            subtitle={
              onboardingContext?.market_bulletin ||
              "Generating real-world market data"
            }
            size="xl"
            showLogo={true}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/5 blur-[80px] rounded-full -z-10 animate-pulse" />
        </div>

        <div className="h-12 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeMessages[messageIdx]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-slate-600 font-medium text-lg"
            >
              {estimateError ? "Almost there..." : activeMessages[messageIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-12 w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-teal-600 rounded-full shadow-[0_0_12px_rgba(13,148,136,0.35)]"
            initial={{ width: "2%" }}
            animate={{ width: estimateError ? "100%" : "92%" }}
            transition={{
              duration: estimateError ? 0.5 : 6,
              ease: estimateError ? "easeOut" : [0.1, 0, 0, 1],
            }}
          />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
          Pulling your details together
        </p>
      </div>
    </PageTransition>
  );
}
