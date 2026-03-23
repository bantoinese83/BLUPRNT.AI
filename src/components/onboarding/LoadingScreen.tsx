import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Loader } from "@/components/ui/Loader";

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
    "Checking local renovation costs...",
    "Analyzing your property scope...",
    `Comparing ${kind} projects...`,
    "Finalizing your financial plan..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % messages.length);
    }, 2000);
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
        <Loader 
          title="Building your Blueprint"
          subtitle={estimateError ? "Almost there..." : messages[messageIdx]}
          size="lg"
        />
        
        {/* Minimal Progress Bar */}
        <div className="mt-8 w-full max-w-[280px] h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-black transition-all duration-1000 ease-in-out"
            style={{ width: `${((messageIdx + 1) / messages.length) * 100}%` }}
          />
        </div>
      </div>
    </PageTransition>
  );
}
