import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Lottie from "lottie-react";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";

// Import animations
import paintLoading from "../../../public/loading-paint-animated-icon.json";
import dreamHouse from "../../../public/dream-house-aimated-icon.json";
import investment from "../../../public/investment-animated-icon.json";


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

  const animations = [
    investment,
    dreamHouse,
    paintLoading
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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="relative mb-12">
          {/* Animated Background Rings */}
          <div className="absolute inset-0 -m-8">
            <div className="absolute inset-0 border-2 border-slate-100/50 rounded-full animate-[ping_3s_ease-in-out_infinite]" />
            <div className="absolute inset-0 border border-slate-50 rounded-full animate-[ping_4s_ease-in-out_infinite_1s]" />
          </div>

          
          {/* Central Logo/Icon Animation */}
          <div className="relative w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center glass border-white overflow-hidden p-2">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 to-slate-400/10 rounded-3xl" />
            <Lottie 
              animationData={animations[messageIdx]} 
              loop={true}
              className="w-full h-full"
            />


            
            {/* Pulsing Dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-400 rounded-full border-2 border-white animate-pulse" />

          </div>

          {/* Floating Accents */}
          <div className="absolute -top-4 -left-4 p-2 glass rounded-xl animate-float">
            <div className="w-3 h-3 bg-slate-900 rounded-full" />
          </div>

          <div className="absolute -bottom-2 -right-6 p-2 glass rounded-xl animate-float [animation-delay:1s]">
            <div className="w-4 h-4 bg-slate-400 rounded-full opacity-50" />
          </div>

        </div>

        <div className="space-y-4 max-w-xs mx-auto">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Building your Blueprint
            </h2>
            <div className="flex justify-center gap-1.5 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-bounce [animation-delay:0.4s]" />
            </div>

          </div>
          
          <div className="relative h-12 flex items-center justify-center overflow-hidden">
            <p className="text-slate-500 font-medium animate-[fadeIn_0.5s_ease-out]">
              {estimateError ? "Almost there…" : messages[messageIdx]}
            </p>
          </div>
        </div>

        {/* Progress Tracker (Subtle) */}
        <div className="mt-12 w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div 
            className="h-full premium-gradient transition-all duration-1000 ease-out"

            style={{ width: `${((messageIdx + 1) / messages.length) * 100}%` }}
          />
        </div>
      </div>
    </PageTransition>
  );
}
