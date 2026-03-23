import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { motion, AnimatePresence } from "motion/react";

export function LoadingScreen() {
  const navigate = useNavigate();
  const { runPhotoToScope, projectType, estimateError } = useOnboarding();
  const [messageIdx, setMessageIdx] = useState(0);

  const kind =
    projectType === "Kitchen"
      ? "kitchen"
      : projectType === "Bathroom"
        ? "kitchen/bath"
        : "similar";

  const messages = [
    "Checking recent project costs in your area…",
    "Sizing your room from the photos…",
    `Comparing similar ${kind} projects…`,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % messages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ensure the user sees the animations for at least 4 seconds
      const minDelay = new Promise(resolve => setTimeout(resolve, 4000));
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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
        <div className="relative mb-16 scale-125 sm:scale-150">
          
          {/* Outer Mesh Rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -m-12 border border-slate-200/40 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -m-8 border border-slate-100/60 rounded-full"
          />

          {/* Liquid Metal Orb Container */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            
            {/* The Orb Shape */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                borderRadius: ["38% 62% 63% 37% / 41% 44% 56% 59%", "45% 55% 48% 52% / 58% 42% 58% 42%", "38% 62% 63% 37% / 41% 44% 56% 59%"]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-slate-900 shadow-2xl overflow-hidden border border-white/20"
            >
              {/* Internal Refraction Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900" />
              
              {/* Moving Highlights (Liquid Metal Feel) */}
              <motion.div 
                animate={{ 
                  x: ["-100%", "100%"],
                  y: ["-100%", "100%"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              />

              {/* Central Core Pulse */}
              <motion.div 
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-2 rounded-full bg-slate-400/20 blur-xl"
              />
            </motion.div>

            {/* Satellite Dots */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -m-4"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rounded-full" />
            </motion.div>

          </div>
        </div>

        <div className="space-y-6 max-w-sm mx-auto z-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Building your Blueprint
            </h2>
            <div className="flex justify-center gap-2 pt-1">
              {[0.1, 0.2, 0.3].map((delay, i) => (
                <motion.div 
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                  className="w-2 h-2 rounded-full bg-slate-900"
                />
              ))}
            </div>
          </div>
          
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p 
                key={messageIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-slate-500 font-semibold text-lg"
              >
                {estimateError ? "Almost there…" : messages[messageIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-16 w-full max-w-[280px] h-1 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-slate-900"
            initial={{ width: "0%" }}
            animate={{ width: `${((messageIdx + 1) / messages.length) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </PageTransition>
  );
}
