import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Loader } from "@/components/ui/Loader";

export function LoadingScreen() {
  const navigate = useNavigate();
  const { runPhotoToScope, projectType, estimateError, locationInput } =
    useOnboarding();
  const [messageIdx, setMessageIdx] = useState(0);

  const kind =
    projectType === "Kitchen"
      ? "kitchen"
      : projectType === "Bathroom"
        ? "bathroom"
        : "project";

  const messages = [
    `Analyzing your ${kind} scope...`,
    locationInput
      ? `Scanning market rates in ${locationInput}...`
      : "Checking local renovation costs...",
    `Matching materials to ${kind} standards...`,
    "Applying current market labor rates...",
    "Finalizing your financial blueprint...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ensure the user sees the animations for at least 5 seconds for "weight"
      const minDelay = new Promise((resolve) => setTimeout(resolve, 5000));
      await Promise.all([runPhotoToScope(), minDelay]);

      if (cancelled) return;
      navigate("/onboarding/estimate", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, runPhotoToScope]);

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[50vh]">
        <div className="relative mb-8">
          <Loader
            title="Building your BLUPRNT"
            subtitle="Generating real-world market data"
            size="xl"
            showLogo={true}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/5 blur-[80px] rounded-full -z-10 animate-pulse" />
        </div>

        <div className="h-12 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messages[messageIdx]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-slate-600 font-medium text-lg"
            >
              {estimateError ? "Almost there..." : messages[messageIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-12 w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
            initial={{ width: "2%" }}
            animate={{ width: estimateError ? "100%" : "92%" }}
            transition={{
              duration: estimateError ? 0.5 : 20,
              ease: estimateError ? "easeOut" : [0.1, 0, 0, 1],
            }}
          />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
          Scanning Database Assets
        </p>
      </div>
    </PageTransition>
  );
}
