import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "motion/react";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { ProjectTypeScreen } from "@/components/onboarding/ProjectTypeScreen";
import { LocationScreen } from "@/components/onboarding/LocationScreen";
import { StageScreen } from "@/components/onboarding/StageScreen";
import { PhotoScreen } from "@/components/onboarding/PhotoScreen";
import { TextScopeScreen } from "@/components/onboarding/TextScopeScreen";
import { LoadingScreen } from "@/components/onboarding/LoadingScreen";
import { EstimateScreen } from "@/components/onboarding/EstimateScreen";
import { SignupScreen } from "@/components/onboarding/SignupScreen";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = [
  { path: "/onboarding/type", label: "Project" },
  { path: "/onboarding/location", label: "Location" },
  { path: "/onboarding/stage", label: "Stage" },
  { path: "/onboarding/photo", label: "Photos" },
  { path: "/onboarding/loading", label: "Analysis" },
  { path: "/onboarding/estimate", label: "Estimate" },
  { path: "/onboarding/signup", label: "Account" },
];

function StepProgress({ currentPath }: { currentPath: string }) {
  const currentIndex = ONBOARDING_STEPS.findIndex(s => s.path === currentPath);
  if (currentIndex === -1) return null;

  return (
    <div className="w-full flex flex-col items-center space-y-3 mb-8">
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div 
          className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>
      <div className="flex justify-between w-full px-1">
        {ONBOARDING_STEPS.map((step, idx) => (
          <div 
            key={step.path}
            className={cn(
              "text-[10px] uppercase tracking-wider font-bold transition-colors duration-300",
              idx <= currentIndex ? "text-indigo-600" : "text-slate-300"
            )}
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const location = useLocation();

  const isWelcome = location.pathname === "/onboarding" || location.pathname === "/onboarding/";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
      <Helmet>
        <title>Get Started — BLUPRNT.AI</title>
        <meta name="description" content="Get a real-world renovation cost estimate in minutes. Start your home project with the right financial baseline." />
      </Helmet>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="relative w-full max-w-md">
          {!isWelcome && <StepProgress currentPath={location.pathname} />}
          
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/type" element={<ProjectTypeScreen />} />
              <Route path="/location" element={<LocationScreen />} />
              <Route path="/stage" element={<StageScreen />} />
              <Route path="/photo" element={<PhotoScreen />} />
              <Route path="/text-scope" element={<TextScopeScreen />} />
              <Route path="/loading" element={<LoadingScreen />} />
              <Route path="/estimate" element={<EstimateScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
      <AppSlimFooter className="mt-auto shrink-0 bg-white/50" />
    </div>
  );
}

