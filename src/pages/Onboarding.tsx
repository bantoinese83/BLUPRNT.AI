import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
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
import { AppSimpleHeader } from "@/components/layout/AppSimpleHeader";
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
  const navigate = useNavigate();
  const currentIndex = ONBOARDING_STEPS.findIndex(
    (s) => s.path === currentPath,
  );
  if (currentIndex === -1) return null;

  const remainingSteps = ONBOARDING_STEPS.length - currentIndex - 1;
  const timeLabel =
    remainingSteps <= 0
      ? "Almost done"
      : remainingSteps === 1
        ? "Seconds away"
        : `${Math.ceil(remainingSteps / 2)} min left`;

  return (
    <div className="w-full flex flex-col items-center space-y-4 mb-8 sm:mb-12">
      <div className="flex w-full justify-between items-end px-1">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60 leading-none">
            Progress — {currentIndex + 1} of {ONBOARDING_STEPS.length}
          </p>
          <h1 className="text-lg sm:text-xl font-black italic tracking-tighter text-slate-900 leading-none">
            {ONBOARDING_STEPS[currentIndex].label}
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {timeLabel}
          </span>
        </div>
      </div>

      <div className="relative w-full px-1">
        {/* Progress Track */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (currentIndex + 1) / ONBOARDING_STEPS.length }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
        </div>

        {/* Clickable Step Markers (Desktop only for full list, or dot-only for mobile) */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-10 flex justify-between px-1 pointer-events-none">
          {ONBOARDING_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            return (
              <button
                key={step.path}
                type="button"
                onClick={() => idx < currentIndex && navigate(step.path)}
                disabled={idx >= currentIndex}
                className={cn(
                  "pointer-events-auto h-3 w-3 rounded-full border-2 transition-all duration-300",
                  idx > currentIndex
                    ? "bg-white border-slate-200"
                    : "bg-white border-transparent",
                  isCompleted && "bg-indigo-600 border-indigo-600",
                  isActive &&
                    "bg-indigo-600 border-indigo-100 ring-2 ring-indigo-600/20 scale-125",
                )}
                aria-label={`Go to step ${idx + 1}: ${step.label}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const location = useLocation();

  const isWelcome =
    location.pathname === "/onboarding" || location.pathname === "/onboarding/";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <Helmet>
        <title>Get Started — BLUPRNT.AI</title>
        <meta
          name="description"
          content="Get a real-world renovation cost estimate in minutes. Start your home project with the right financial baseline."
        />
      </Helmet>

      <AppSimpleHeader showSignIn={isWelcome} />

      <div className="flex flex-1 flex-col items-center p-4 sm:p-6">
        <div className="hidden sm:block w-full max-w-4xl py-2 mb-6">
          <Breadcrumbs className="px-2" />
        </div>

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
